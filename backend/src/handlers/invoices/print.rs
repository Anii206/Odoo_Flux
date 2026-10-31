use axum::{
    extract::{Path, State},
    response::Html,
};
use sqlx::PgPool;
use uuid::Uuid;

use crate::{
    auth::AuthenticatedUser,
    error::AppError,
    models::{Invoice, InvoiceLine, Product, ProductVariant},
};

pub async fn print_invoice(
    auth: AuthenticatedUser,
    Path(id): Path<Uuid>,
    State(pool): State<PgPool>,
) -> Result<Html<String>, AppError> {
    let invoice = sqlx::query_as::<_, Invoice>(
        "SELECT id, invoice_number, subscription_id, customer_id, billing_period_start, billing_period_end, status, subtotal, discount_amount, tax_amount, grand_total, amount_paid, due_date, created_at FROM invoices WHERE id = $1",
    )
    .bind(id)
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::NotFound(format!("Invoice {} not found", id)))?;

    if auth.role == "customer" && invoice.customer_id != auth.id {
        return Err(AppError::Forbidden("Access denied.".into()));
    }

    let customer_email = sqlx::query_scalar::<_, String>("SELECT email FROM users WHERE id = $1")
        .bind(invoice.customer_id)
        .fetch_optional(&pool)
        .await?
        .unwrap_or_else(|| "customer@brightloop.io".to_string());

    let lines = sqlx::query_as::<_, InvoiceLine>(
        "SELECT id, invoice_id, product_id, variant_id, quantity, unit_price, tax_rate, line_total, created_at FROM invoice_lines WHERE invoice_id = $1",
    )
    .bind(id)
    .fetch_all(&pool)
    .await?;

    let mut line_rows = String::new();
    for l in lines {
        let p_name = sqlx::query_as::<_, Product>("SELECT id, name, product_type, sales_price, cost_price, notes, created_at FROM products WHERE id = $1")
            .bind(l.product_id).fetch_optional(&pool).await?.map(|p| p.name).unwrap_or_else(|| "Standard Product".into());
        let v_info = match l.variant_id {
            Some(v_id) => sqlx::query_as::<_, ProductVariant>("SELECT id, product_id, attribute_name, attribute_value, price_extra, created_at FROM product_variants WHERE id = $1")
                .bind(v_id).fetch_optional(&pool).await?.map(|v| format!(" ({} - {})", v.attribute_name, v.attribute_value)).unwrap_or_default(),
            None => String::new(),
        };

        line_rows.push_str(&format!(
            "<tr><td>{}{}</td><td class='r'>{}</td><td class='r'>${:.2}</td><td class='r'>{}%</td><td class='r'>${:.2}</td></tr>",
            p_name, v_info, l.quantity, l.unit_price, l.tax_rate, l.line_total
        ));
    }

    let balance_due = (invoice.grand_total - invoice.amount_paid).max(rust_decimal::Decimal::ZERO);
    let html = format!(
        r#"<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Tax Invoice - {num}</title>
<style>
  body {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #1e293b; padding: 40px; margin: 0; background: #f8fafc; }}
  .invoice-box {{ max-width: 800px; margin: auto; padding: 36px; border: 1px solid #e2e8f0; border-radius: 12px; background: #fff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }}
  .header {{ display: flex; justify-content: space-between; border-bottom: 2px solid #6366f1; padding-bottom: 20px; }}
  .brand {{ font-size: 26px; font-weight: 800; color: #4338ca; }}
  .badge {{ display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 700; text-transform: uppercase; }}
  .badge-paid {{ background: #dcfce7; color: #15803d; }} .badge-confirmed {{ background: #dbeafe; color: #1d4ed8; }}
  .badge-draft {{ background: #f1f5f9; color: #475569; }} .badge-cancelled {{ background: #fee2e2; color: #b91c1c; }}
  .meta-grid {{ display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin: 28px 0; }}
  table {{ width: 100%; border-collapse: collapse; margin-top: 20px; }}
  th {{ background: #f8fafc; color: #64748b; font-size: 12px; text-transform: uppercase; padding: 12px; text-align: left; border-bottom: 2px solid #e2e8f0; }}
  td {{ padding: 12px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }}
  .r {{ text-align: right; }}
  .summary {{ margin-top: 28px; display: flex; justify-content: flex-end; }}
  .summary-table {{ width: 320px; }}
  .summary-table td {{ padding: 6px 12px; }}
  .grand {{ font-size: 18px; font-weight: 800; color: #0f172a; border-top: 2px solid #e2e8f0; }}
  .actions {{ margin-top: 30px; text-align: center; }}
  .btn {{ background: #6366f1; color: #fff; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: 600; }}
  @media print {{ body {{ background: #fff; padding: 0; }} .invoice-box {{ box-shadow: none; border: none; padding: 0; }} .actions {{ display: none; }} }}
</style></head>
<body>
<div class="invoice-box">
  <div class="header">
    <div><div class="brand">Brightloop Systems</div><div>Zero-SaaS Subscription Management</div><div>GSTIN: BRIGHT-LOOP-TAX-2026</div></div>
    <div style="text-align: right;"><div style="font-size: 22px; font-weight: 700;">OFFICIAL TAX INVOICE</div><div style="margin-top: 4px;"><span class="badge badge-{status_cls}">{status}</span></div></div>
  </div>
  <div class="meta-grid">
    <div><strong>Billed To:</strong><br>{cust_email}<br>Customer ID: {cust_id}</div>
    <div style="text-align: right;"><strong>Invoice #:</strong> {num}<br><strong>Period:</strong> {start} to {end}<br><strong>Due Date:</strong> {due}</div>
  </div>
  <table>
    <thead><tr><th>Description</th><th class="r">Qty</th><th class="r">Unit Price</th><th class="r">Tax Rate</th><th class="r">Total</th></tr></thead>
    <tbody>{lines}</tbody>
  </table>
  <div class="summary">
    <table class="summary-table">
      <tr><td>Subtotal:</td><td class="r">${subtotal:.2}</td></tr>
      <tr><td>Discount:</td><td class="r">-${discount:.2}</td></tr>
      <tr><td>Tax Amount:</td><td class="r">+${tax:.2}</td></tr>
      <tr class="grand"><td>Grand Total:</td><td class="r">${grand:.2}</td></tr>
      <tr><td>Amount Paid:</td><td class="r">${paid:.2}</td></tr>
      <tr style="font-weight: 700; color: #dc2626;"><td>Balance Due:</td><td class="r">${balance:.2}</td></tr>
    </table>
  </div>
  <div class="actions"><button class="btn" onclick="window.print()">Print / Save PDF</button></div>
</div></body></html>"#,
        num = invoice.invoice_number,
        status = invoice.status.to_uppercase(),
        status_cls = invoice.status,
        cust_email = customer_email,
        cust_id = invoice.customer_id,
        start = invoice.billing_period_start,
        end = invoice.billing_period_end,
        due = invoice.due_date,
        lines = line_rows,
        subtotal = invoice.subtotal,
        discount = invoice.discount_amount,
        tax = invoice.tax_amount,
        grand = invoice.grand_total,
        paid = invoice.amount_paid,
        balance = balance_due,
    );

    Ok(Html(html))
}
