use axum::{
    extract::{Path, State},
    Json,
};
use sqlx::PgPool;
use uuid::Uuid;

use crate::{
    auth::AuthenticatedUser,
    error::AppError,
    models::DiscountRule,
};

pub async fn list_discount_rules(
    _auth: AuthenticatedUser,
    State(pool): State<PgPool>,
) -> Result<Json<Vec<DiscountRule>>, AppError> {
    let rules = sqlx::query_as::<_, DiscountRule>(
        "SELECT id, name, discount_type, value, min_purchase_amount, min_quantity, start_date, end_date, max_uses, current_uses, applies_to, target_product_id, created_at FROM discount_rules ORDER BY created_at DESC",
    )
    .fetch_all(&pool)
    .await?;

    Ok(Json(rules))
}

pub async fn get_discount_rule(
    _auth: AuthenticatedUser,
    Path(id): Path<Uuid>,
    State(pool): State<PgPool>,
) -> Result<Json<DiscountRule>, AppError> {
    let rule = sqlx::query_as::<_, DiscountRule>(
        "SELECT id, name, discount_type, value, min_purchase_amount, min_quantity, start_date, end_date, max_uses, current_uses, applies_to, target_product_id, created_at FROM discount_rules WHERE id = $1",
    )
    .bind(id)
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::NotFound(format!("Discount rule with ID {} not found", id)))?;

    Ok(Json(rule))
}
