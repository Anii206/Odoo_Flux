use axum::{
    extract::{Path, State},
    Json,
};
use rust_decimal::Decimal;
use sqlx::PgPool;
use uuid::Uuid;

use crate::{
    auth::RequireStaffOrAdmin,
    error::AppError,
    handlers::invoices::types::{CreateInvoiceInput, InvoiceWithLines, UpdateInvoiceStatusRequest},
    models::{Invoice, InvoiceLine},
};

pub async fn create_invoice(
    _staff: RequireStaffOrAdmin,
    State(pool): State<PgPool>,
    Json(payload): Json<CreateInvoiceInput>,
) -> Result<Json<InvoiceWithLines>, AppError> {
    if payload.lines.is_empty() {
        return Err(AppError::BadRequest("Invoice must contain at least one line item.".to_string()));
    }

    let mut tx = pool.begin().await?;
    let seq_val: i64 = sqlx::query_scalar("SELECT nextval('invoice_num_seq')")
        .fetch_one(&mut *tx)
        .await
        .unwrap_or(chrono::Utc::now().timestamp_micros() % 1000000);
    let year = chrono::Utc::now().format("%Y");
    let invoice_number = format!("INV-{}-{:06}", year, seq_val);

    let discount_amount = payload.discount_amount.unwrap_or(Decimal::ZERO);
    let tax_amount = payload.tax_amount.unwrap_or(Decimal::ZERO);

    let invoice = sqlx::query_as::<_, Invoice>(
        r#"
        INSERT INTO invoices (
            invoice_number, subscription_id, customer_id, billing_period_start, billing_period_end,
            status, subtotal, discount_amount, tax_amount, grand_total, amount_paid, due_date
        )
        VALUES ($1, $2, $3, $4, $5, 'confirmed', $6, $7, $8, $9, 0.00, $10)
        RETURNING id, invoice_number, subscription_id, customer_id, billing_period_start, billing_period_end, status, subtotal, discount_amount, tax_amount, grand_total, amount_paid, due_date, created_at
        "#,
    )
    .bind(&invoice_number).bind(payload.subscription_id).bind(payload.customer_id)
    .bind(payload.billing_period_start).bind(payload.billing_period_end)
    .bind(payload.subtotal).bind(discount_amount).bind(tax_amount)
    .bind(payload.grand_total).bind(payload.due_date)
    .fetch_one(&mut *tx).await?;

    let mut lines = Vec::new();
    for line in payload.lines {
        let tax_rate = line.tax_rate.unwrap_or(Decimal::ZERO);
        let inv_line = sqlx::query_as::<_, InvoiceLine>(
            r#"
            INSERT INTO invoice_lines (
                invoice_id, product_id, variant_id, quantity, unit_price, tax_rate, line_total
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id, invoice_id, product_id, variant_id, quantity, unit_price, tax_rate, line_total, created_at
            "#,
        )
        .bind(invoice.id).bind(line.product_id).bind(line.variant_id)
        .bind(line.quantity).bind(line.unit_price).bind(tax_rate).bind(line.line_total)
        .fetch_one(&mut *tx).await?;
        lines.push(inv_line);
    }
    tx.commit().await?;

    Ok(Json(InvoiceWithLines { invoice, lines }))
}

pub async fn update_invoice_status(
    _staff: RequireStaffOrAdmin,
    Path(id): Path<Uuid>,
    State(pool): State<PgPool>,
    Json(payload): Json<UpdateInvoiceStatusRequest>,
) -> Result<Json<InvoiceWithLines>, AppError> {
    let invoice = sqlx::query_as::<_, Invoice>(
        "SELECT id, invoice_number, subscription_id, customer_id, billing_period_start, billing_period_end, status, subtotal, discount_amount, tax_amount, grand_total, amount_paid, due_date, created_at FROM invoices WHERE id = $1",
    )
    .bind(id)
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::NotFound(format!("Invoice {} not found", id)))?;

    let from = invoice.status.as_str();
    let to = payload.status.trim();
    let valid = match (from, to) {
        ("draft", "confirmed") | ("draft", "cancelled") => true,
        ("confirmed", "paid") | ("confirmed", "cancelled") => true,
        ("paid", "cancelled") => true,
        _ => false,
    };
    if !valid {
        return Err(AppError::BadRequest(format!("Invalid invoice transition from '{}' to '{}'.", from, to)));
    }

    let mut tx = pool.begin().await?;

    let updated = sqlx::query_as::<_, Invoice>(
        r#"
        UPDATE invoices SET status = $1 WHERE id = $2
        RETURNING id, invoice_number, subscription_id, customer_id, billing_period_start, billing_period_end, status, subtotal, discount_amount, tax_amount, grand_total, amount_paid, due_date, created_at
        "#,
    )
    .bind(to).bind(id).fetch_one(&mut *tx).await?;

    if to == "confirmed" {
        let cust_email = sqlx::query_scalar::<_, String>("SELECT email FROM users WHERE id = $1")
            .bind(updated.customer_id)
            .fetch_optional(&mut *tx)
            .await?
            .unwrap_or_else(|| "customer@brightloop.io".to_string());

        let subject = format!("Invoice Confirmed - {}", updated.invoice_number);
        let body_html = format!(
            r#"<div style="font-family: sans-serif; padding: 20px;">
                <h2>Invoice Confirmed</h2>
                <p>Dear Customer,</p>
                <p>Your invoice <strong>{}</strong> has been confirmed.</p>
                <ul>
                    <li>Billing Period: {} to {}</li>
                    <li>Grand Total: ${}</li>
                    <li>Due Date: {}</li>
                </ul>
                <p>Thank you for choosing Brightloop Subscription Services.</p>
            </div>"#,
            updated.invoice_number, updated.billing_period_start, updated.billing_period_end, updated.grand_total, updated.due_date
        );

        sqlx::query(
            "INSERT INTO local_emails (recipient_email, subject, body_html) VALUES ($1, $2, $3)",
        )
        .bind(cust_email)
        .bind(subject)
        .bind(body_html)
        .execute(&mut *tx)
        .await?;
    }

    let lines = sqlx::query_as::<_, InvoiceLine>(
        "SELECT id, invoice_id, product_id, variant_id, quantity, unit_price, tax_rate, line_total, created_at FROM invoice_lines WHERE invoice_id = $1",
    )
    .bind(id)
    .fetch_all(&mut *tx)
    .await?;

    tx.commit().await?;

    Ok(Json(InvoiceWithLines { invoice: updated, lines }))
}
