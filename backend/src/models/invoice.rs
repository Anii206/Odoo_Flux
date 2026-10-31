use chrono::{DateTime, NaiveDate, Utc};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Invoice {
    pub id: Uuid,
    pub invoice_number: String,
    pub subscription_id: Uuid,
    pub customer_id: Uuid,
    pub billing_period_start: NaiveDate,
    pub billing_period_end: NaiveDate,
    pub status: String, // 'draft', 'confirmed', 'paid', 'cancelled'
    pub subtotal: Decimal,
    pub discount_amount: Decimal,
    pub tax_amount: Decimal,
    pub grand_total: Decimal,
    pub amount_paid: Decimal,
    pub due_date: NaiveDate,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct InvoiceLine {
    pub id: Uuid,
    pub invoice_id: Uuid,
    pub product_id: Uuid,
    pub variant_id: Option<Uuid>,
    pub quantity: i32,
    pub unit_price: Decimal,
    pub tax_rate: Decimal,
    pub line_total: Decimal,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
#[allow(dead_code)]
pub struct Payment {
    pub id: Uuid,
    pub invoice_id: Uuid,
    pub payment_method: String, // 'bank_transfer', 'card', 'upi', 'cash'
    pub amount: Decimal,
    pub payment_date: NaiveDate,
    pub note: Option<String>,
    pub payment_source: String, // 'customer_simulated' vs 'staff_manual'
    pub created_at: DateTime<Utc>,
}
