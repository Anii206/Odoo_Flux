use chrono::{DateTime, Utc};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Product {
    pub id: Uuid,
    pub name: String,
    pub product_type: String, // 'software', 'addon', 'service'
    pub sales_price: Decimal,
    pub cost_price: Decimal,
    pub notes: Option<String>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct ProductVariant {
    pub id: Uuid,
    pub product_id: Uuid,
    pub attribute_name: String, // e.g. 'Brand'
    pub attribute_value: String, // e.g. 'Odoo'
    pub price_extra: Decimal,
    pub created_at: DateTime<Utc>,
}
