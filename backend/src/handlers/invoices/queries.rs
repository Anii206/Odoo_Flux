use axum::{
    extract::{Path, State},
    Json,
};
use sqlx::PgPool;
use uuid::Uuid;

use crate::{
    auth::AuthenticatedUser,
    error::AppError,
    handlers::invoices::types::InvoiceWithLines,
    models::{Invoice, InvoiceLine},
};

pub async fn list_invoices(
    auth: AuthenticatedUser,
    State(pool): State<PgPool>,
) -> Result<Json<Vec<InvoiceWithLines>>, AppError> {
    let invoices = if auth.role == "customer" {
        sqlx::query_as::<_, Invoice>(
            "SELECT id, invoice_number, subscription_id, customer_id, billing_period_start, billing_period_end, status, subtotal, discount_amount, tax_amount, grand_total, amount_paid, due_date, created_at FROM invoices WHERE customer_id = $1 ORDER BY created_at DESC LIMIT 200",
        )
        .bind(auth.id)
        .fetch_all(&pool)
        .await?
    } else {
        sqlx::query_as::<_, Invoice>(
            "SELECT id, invoice_number, subscription_id, customer_id, billing_period_start, billing_period_end, status, subtotal, discount_amount, tax_amount, grand_total, amount_paid, due_date, created_at FROM invoices ORDER BY created_at DESC LIMIT 200",
        )
        .fetch_all(&pool)
        .await?
    };

    let inv_ids: Vec<Uuid> = invoices.iter().map(|i| i.id).collect();
    let lines = if inv_ids.is_empty() {
        Vec::new()
    } else {
        sqlx::query_as::<_, InvoiceLine>(
            "SELECT id, invoice_id, product_id, variant_id, quantity, unit_price, tax_rate, line_total, created_at FROM invoice_lines WHERE invoice_id = ANY($1)",
        )
        .bind(&inv_ids)
        .fetch_all(&pool)
        .await?
    };

    use std::collections::HashMap;
    let mut lines_map: HashMap<Uuid, Vec<InvoiceLine>> = HashMap::new();
    for line in lines {
        lines_map.entry(line.invoice_id).or_default().push(line);
    }

    let result = invoices
        .into_iter()
        .map(|inv| {
            let inv_lines = lines_map.remove(&inv.id).unwrap_or_default();
            InvoiceWithLines { invoice: inv, lines: inv_lines }
        })
        .collect();

    Ok(Json(result))
}

pub async fn get_invoice(
    auth: AuthenticatedUser,
    Path(id): Path<Uuid>,
    State(pool): State<PgPool>,
) -> Result<Json<InvoiceWithLines>, AppError> {
    let invoice = sqlx::query_as::<_, Invoice>(
        "SELECT id, invoice_number, subscription_id, customer_id, billing_period_start, billing_period_end, status, subtotal, discount_amount, tax_amount, grand_total, amount_paid, due_date, created_at FROM invoices WHERE id = $1",
    )
    .bind(id)
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::NotFound(format!("Invoice {} not found", id)))?;

    if auth.role == "customer" && invoice.customer_id != auth.id {
        return Err(AppError::Forbidden("Access denied to this invoice.".into()));
    }

    let lines = sqlx::query_as::<_, InvoiceLine>(
        "SELECT id, invoice_id, product_id, variant_id, quantity, unit_price, tax_rate, line_total, created_at FROM invoice_lines WHERE invoice_id = $1",
    )
    .bind(id)
    .fetch_all(&pool)
    .await?;

    Ok(Json(InvoiceWithLines { invoice, lines }))
}
