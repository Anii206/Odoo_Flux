use axum::{
    extract::{Path, State},
    Json,
};
use rust_decimal::Decimal;
use sqlx::PgPool;
use uuid::Uuid;

use crate::{
    auth::AuthenticatedUser,
    error::AppError,
    handlers::payments::types::{RecordPaymentRequest, RecordPaymentResponse},
    models::{Invoice, Payment},
};

pub async fn record_payment(
    auth: AuthenticatedUser,
    Path(invoice_id): Path<Uuid>,
    State(pool): State<PgPool>,
    Json(payload): Json<RecordPaymentRequest>,
) -> Result<Json<RecordPaymentResponse>, AppError> {
    if !["bank_transfer", "card", "upi", "cash"].contains(&payload.payment_method.as_str()) {
        return Err(AppError::BadRequest(
            "payment_method must be one of: 'bank_transfer', 'card', 'upi', 'cash'.".into(),
        ));
    }
    if payload.amount <= Decimal::ZERO {
        return Err(AppError::BadRequest("Payment amount must be greater than zero.".into()));
    }

    let mut tx = pool.begin().await?;

    let invoice = sqlx::query_as::<_, Invoice>(
        "SELECT id, invoice_number, subscription_id, customer_id, billing_period_start, billing_period_end, status, subtotal, discount_amount, tax_amount, grand_total, amount_paid, due_date, created_at FROM invoices WHERE id = $1 FOR UPDATE",
    )
    .bind(invoice_id)
    .fetch_optional(&mut *tx)
    .await?
    .ok_or_else(|| AppError::NotFound(format!("Invoice {} not found", invoice_id)))?;

    if auth.role == "customer" && invoice.customer_id != auth.id {
        return Err(AppError::Forbidden("Access denied: You can only pay your own invoices.".into()));
    }

    if invoice.status == "cancelled" {
        return Err(AppError::BadRequest("Cannot record payments against cancelled invoices.".into()));
    }

    let balance_due = (invoice.grand_total - invoice.amount_paid).max(Decimal::ZERO);
    if payload.amount > balance_due {
        return Err(AppError::BadRequest(format!(
            "Payment amount (${:.2}) cannot exceed the remaining balance due (${:.2}).",
            payload.amount, balance_due
        )));
    }

    let payment_source = if auth.role == "customer" {
        "customer_simulated"
    } else {
        "staff_manual"
    };

    let payment_date = payload.payment_date.unwrap_or_else(|| chrono::Utc::now().date_naive());

    let payment = sqlx::query_as::<_, Payment>(
        r#"
        INSERT INTO payments (invoice_id, payment_method, amount, payment_date, note, payment_source)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, invoice_id, payment_method, amount, payment_date, note, payment_source, created_at
        "#,
    )
    .bind(invoice_id)
    .bind(&payload.payment_method)
    .bind(payload.amount)
    .bind(payment_date)
    .bind(payload.note.map(|n| n.trim().to_string()))
    .bind(payment_source)
    .fetch_one(&mut *tx)
    .await?;

    let new_amount_paid = invoice.amount_paid + payload.amount;
    let new_status = if new_amount_paid >= invoice.grand_total {
        "paid"
    } else if invoice.status == "draft" {
        "confirmed"
    } else {
        invoice.status.as_str()
    };

    let updated_invoice = sqlx::query_as::<_, Invoice>(
        r#"
        UPDATE invoices
        SET amount_paid = $1, status = $2
        WHERE id = $3
        RETURNING id, invoice_number, subscription_id, customer_id, billing_period_start, billing_period_end, status, subtotal, discount_amount, tax_amount, grand_total, amount_paid, due_date, created_at
        "#,
    )
    .bind(new_amount_paid)
    .bind(new_status)
    .bind(invoice_id)
    .fetch_one(&mut *tx)
    .await?;

    tx.commit().await?;

    Ok(Json(RecordPaymentResponse {
        payment,
        invoice: updated_invoice,
    }))
}

pub async fn list_payments(
    auth: AuthenticatedUser,
    Path(invoice_id): Path<Uuid>,
    State(pool): State<PgPool>,
) -> Result<Json<Vec<Payment>>, AppError> {
    let invoice = sqlx::query_as::<_, Invoice>(
        "SELECT id, invoice_number, subscription_id, customer_id, billing_period_start, billing_period_end, status, subtotal, discount_amount, tax_amount, grand_total, amount_paid, due_date, created_at FROM invoices WHERE id = $1",
    )
    .bind(invoice_id)
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::NotFound(format!("Invoice {} not found", invoice_id)))?;

    if auth.role == "customer" && invoice.customer_id != auth.id {
        return Err(AppError::Forbidden("Access denied.".into()));
    }

    let payments = sqlx::query_as::<_, Payment>(
        "SELECT id, invoice_id, payment_method, amount, payment_date, note, payment_source, created_at FROM payments WHERE invoice_id = $1 ORDER BY payment_date DESC, created_at DESC",
    )
    .bind(invoice_id)
    .fetch_all(&pool)
    .await?;

    Ok(Json(payments))
}
