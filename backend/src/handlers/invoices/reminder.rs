use axum::{
    extract::{Path, State},
    Json,
};
use serde_json::{json, Value};
use sqlx::PgPool;
use uuid::Uuid;

use crate::{
    auth::RequireStaffOrAdmin,
    error::AppError,
    models::Invoice,
};

pub async fn send_invoice_reminder(
    _staff: RequireStaffOrAdmin,
    Path(id): Path<Uuid>,
    State(pool): State<PgPool>,
) -> Result<Json<Value>, AppError> {
    let invoice = sqlx::query_as::<_, Invoice>(
        r#"
        SELECT id, invoice_number, subscription_id, customer_id, billing_period_start,
               billing_period_end, status, subtotal, discount_amount, tax_amount,
               grand_total, amount_paid, due_date, created_at
        FROM invoices WHERE id = $1
        "#,
    )
    .bind(id)
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::NotFound(format!("Invoice {} not found", id)))?;

    let cust_email = sqlx::query_scalar::<_, String>("SELECT email FROM users WHERE id = $1")
        .bind(invoice.customer_id)
        .fetch_optional(&pool)
        .await?
        .unwrap_or_else(|| "customer@brightloop.io".to_string());

    let subject = format!("PAYMENT REMINDER: Invoice {} is Overdue", invoice.invoice_number);
    let body_html = format!(
        r#"<div style="font-family: sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h2 style="color: #b91c1c;">Payment Overdue Notice</h2>
            <p>Dear Valued Customer,</p>
            <p>This is a formal reminder that invoice <strong>{}</strong> has passed its due date of <strong>{}</strong>.</p>
            <ul>
                <li>Total Amount: <strong>${}</strong></li>
                <li>Amount Paid: ${}</li>
                <li>Outstanding Due: <strong>${}</strong></li>
            </ul>
            <p>Please log in to your Brightloop Customer Portal to settle this invoice.</p>
            <p>Brightloop Automated Finance Lead</p>
        </div>"#,
        invoice.invoice_number,
        invoice.due_date,
        invoice.grand_total,
        invoice.amount_paid,
        (invoice.grand_total - invoice.amount_paid)
    );

    sqlx::query(
        "INSERT INTO local_emails (recipient_email, subject, body_html) VALUES ($1, $2, $3)",
    )
    .bind(&cust_email)
    .bind(&subject)
    .bind(&body_html)
    .execute(&pool)
    .await?;

    Ok(Json(json!({
        "success": true,
        "message": format!("Overdue payment reminder sent to {}", cust_email),
        "recipient": cust_email
    })))
}
