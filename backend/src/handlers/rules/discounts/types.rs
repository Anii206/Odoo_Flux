use rust_decimal::Decimal;
use serde::Deserialize;
use uuid::Uuid;

use crate::error::AppError;

#[derive(Debug, Deserialize)]
pub struct CreateDiscountRuleRequest {
    pub name: String,
    pub discount_type: String, // 'fixed', 'percentage'
    pub value: Decimal,
    pub min_purchase_amount: Option<Decimal>,
    pub min_quantity: Option<i32>,
    pub start_date: chrono::NaiveDate,
    pub end_date: Option<chrono::NaiveDate>,
    pub max_uses: Option<i32>,
    pub applies_to: String, // 'all', 'product'
    pub target_product_id: Option<Uuid>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateDiscountRuleRequest {
    pub name: Option<String>,
    pub discount_type: Option<String>,
    pub value: Option<Decimal>,
    pub min_purchase_amount: Option<Decimal>,
    pub min_quantity: Option<i32>,
    pub start_date: Option<chrono::NaiveDate>,
    pub end_date: Option<chrono::NaiveDate>,
    pub max_uses: Option<i32>,
    pub applies_to: Option<String>,
    pub target_product_id: Option<Uuid>,
}

pub fn validate_discount_fields(
    d_type: &str,
    val: Decimal,
    min_amount: Decimal,
    min_qty: i32,
    start: chrono::NaiveDate,
    end: Option<chrono::NaiveDate>,
    max_uses: Option<i32>,
    applies: &str,
    target: Option<Uuid>,
) -> Result<(), AppError> {
    if !["fixed", "percentage"].contains(&d_type) {
        return Err(AppError::BadRequest("discount_type must be 'fixed' or 'percentage'.".into()));
    }
    if d_type == "percentage" && (val < Decimal::ZERO || val > Decimal::from(100)) {
        return Err(AppError::BadRequest("Percentage discount must be between 0 and 100.".into()));
    }
    if d_type == "fixed" && val < Decimal::ZERO {
        return Err(AppError::BadRequest("Fixed discount value cannot be negative.".into()));
    }
    if min_amount < Decimal::ZERO || min_qty < 0 {
        return Err(AppError::BadRequest("Minimum amount and quantity must be non-negative.".into()));
    }
    if let Some(e) = end {
        if e < start {
            return Err(AppError::BadRequest("end_date must be on or after start_date.".into()));
        }
    }
    if let Some(m) = max_uses {
        if m <= 0 {
            return Err(AppError::BadRequest("max_uses must be greater than zero.".into()));
        }
    }
    if !["all", "product"].contains(&applies) {
        return Err(AppError::BadRequest("applies_to must be 'all' or 'product'.".into()));
    }
    if applies == "product" && target.is_none() {
        return Err(AppError::BadRequest("target_product_id is required when applies_to is 'product'.".into()));
    }
    Ok(())
}
