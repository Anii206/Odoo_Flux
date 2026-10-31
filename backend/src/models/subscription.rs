use chrono::{DateTime, NaiveDate, Utc};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Subscription {
    pub id: Uuid,
    pub sub_number: String,
    pub customer_id: Uuid,
    pub plan_id: Uuid,
    pub status: String, // 'draft', 'quotation', 'confirmed', 'active', 'paused', 'closed'
    pub start_date: NaiveDate,
    pub expiry_date: Option<NaiveDate>,
    pub next_billing_date: NaiveDate,
    pub payment_terms_days: i32,
    pub applied_discount_id: Option<Uuid>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct SubscriptionLine {
    pub id: Uuid,
    pub subscription_id: Uuid,
    pub product_id: Uuid,
    pub variant_id: Option<Uuid>,
    pub quantity: i32,
    pub unit_price: Decimal,
    pub tax_rate: Decimal,
    pub line_total: Decimal,
    pub created_at: DateTime<Utc>,
}
