use chrono::{DateTime, NaiveDate, Utc};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Plan {
    pub id: Uuid,
    pub name: String,
    pub billing_interval: String, // 'daily', 'weekly', 'monthly', 'yearly'
    pub plan_price: Decimal,
    pub min_quantity: i32,
    pub available_from: NaiveDate,
    pub available_to: Option<NaiveDate>,
    pub auto_close: bool,
    pub allow_early_close: bool,
    pub allow_pause: bool,
    pub allow_renew: bool,
    pub created_at: DateTime<Utc>,
}
