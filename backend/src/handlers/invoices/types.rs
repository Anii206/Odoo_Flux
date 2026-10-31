use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::models::{Invoice, InvoiceLine};

#[derive(Debug, Serialize, Deserialize)]
pub struct InvoiceWithLines {
    pub invoice: Invoice,
    pub lines: Vec<InvoiceLine>,
}

#[derive(Debug, Deserialize)]
pub struct CreateInvoiceLineInput {
    pub product_id: Uuid,
    pub variant_id: Option<Uuid>,
    pub quantity: i32,
    pub unit_price: Decimal,
    pub tax_rate: Option<Decimal>,
    pub line_total: Decimal,
}

#[derive(Debug, Deserialize)]
pub struct CreateInvoiceInput {
    pub subscription_id: Uuid,
    pub customer_id: Uuid,
    pub billing_period_start: chrono::NaiveDate,
    pub billing_period_end: chrono::NaiveDate,
    pub subtotal: Decimal,
    pub discount_amount: Option<Decimal>,
    pub tax_amount: Option<Decimal>,
    pub grand_total: Decimal,
    pub due_date: chrono::NaiveDate,
    pub lines: Vec<CreateInvoiceLineInput>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateInvoiceStatusRequest {
    pub status: String, // 'draft', 'confirmed', 'paid', 'cancelled'
}
