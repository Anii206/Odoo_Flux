use chrono::{DateTime, NaiveDate, Utc};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct TaxRule {
    pub id: Uuid,
    pub name: String,
    pub rate_percentage: Decimal,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct DiscountRule {
    pub id: Uuid,
    pub name: String,
    pub discount_type: String, // 'fixed', 'percentage'
    pub value: Decimal,
    pub min_purchase_amount: Decimal,
    pub min_quantity: i32,
    pub start_date: NaiveDate,
    pub end_date: Option<NaiveDate>,
    pub max_uses: Option<i32>,
    pub current_uses: i32,
    pub applies_to: String, // 'all', 'product'
    pub target_product_id: Option<Uuid>,
    pub created_at: DateTime<Utc>,
}
