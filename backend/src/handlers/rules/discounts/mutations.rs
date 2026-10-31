use axum::{
    extract::{Path, State},
    Json,
};
use rust_decimal::Decimal;
use serde_json::json;
use sqlx::PgPool;
use uuid::Uuid;

use crate::{
    auth::RequireAdmin,
    error::AppError,
    handlers::rules::discounts::types::{validate_discount_fields, CreateDiscountRuleRequest, UpdateDiscountRuleRequest},
    models::DiscountRule,
};

pub async fn create_discount_rule(
    _admin: RequireAdmin,
    State(pool): State<PgPool>,
    Json(payload): Json<CreateDiscountRuleRequest>,
) -> Result<Json<DiscountRule>, AppError> {
    let min_amount = payload.min_purchase_amount.unwrap_or(Decimal::ZERO);
    let min_qty = payload.min_quantity.unwrap_or(0);
    validate_discount_fields(
        &payload.discount_type, payload.value, min_amount, min_qty,
        payload.start_date, payload.end_date, payload.max_uses,
        &payload.applies_to, payload.target_product_id,
    )?;

    if let Some(target_id) = payload.target_product_id {
        let exists = sqlx::query_scalar::<_, i64>("SELECT COUNT(*) FROM products WHERE id = $1")
            .bind(target_id)
            .fetch_one(&pool)
            .await?;
        if exists == 0 {
            return Err(AppError::NotFound(format!("Target product with ID {} not found", target_id)));
        }
    }

    let target_id = if payload.applies_to == "product" { payload.target_product_id } else { None };

    let rule = sqlx::query_as::<_, DiscountRule>(
        r#"
        INSERT INTO discount_rules (
            name, discount_type, value, min_purchase_amount, min_quantity,
            start_date, end_date, max_uses, current_uses, applies_to, target_product_id
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0, $9, $10)
        RETURNING id, name, discount_type, value, min_purchase_amount, min_quantity, start_date, end_date, max_uses, current_uses, applies_to, target_product_id, created_at
        "#,
    )
    .bind(payload.name.trim())
    .bind(&payload.discount_type)
    .bind(payload.value)
    .bind(min_amount)
    .bind(min_qty)
    .bind(payload.start_date)
    .bind(payload.end_date)
    .bind(payload.max_uses)
    .bind(&payload.applies_to)
    .bind(target_id)
    .fetch_one(&pool)
    .await?;

    Ok(Json(rule))
}

pub async fn update_discount_rule(
    _admin: RequireAdmin,
    Path(id): Path<Uuid>,
    State(pool): State<PgPool>,
    Json(payload): Json<UpdateDiscountRuleRequest>,
) -> Result<Json<DiscountRule>, AppError> {
    let ex = sqlx::query_as::<_, DiscountRule>(
        "SELECT id, name, discount_type, value, min_purchase_amount, min_quantity, start_date, end_date, max_uses, current_uses, applies_to, target_product_id, created_at FROM discount_rules WHERE id = $1",
    )
    .bind(id)
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::NotFound(format!("Discount rule with ID {} not found", id)))?;

    let d_type = payload.discount_type.unwrap_or(ex.discount_type);
    let val = payload.value.unwrap_or(ex.value);
    let min_amount = payload.min_purchase_amount.unwrap_or(ex.min_purchase_amount);
    let min_qty = payload.min_quantity.unwrap_or(ex.min_quantity);
    let start = payload.start_date.unwrap_or(ex.start_date);
    let end = payload.end_date.or(ex.end_date);
    let max_uses = payload.max_uses.or(ex.max_uses);
    let applies = payload.applies_to.unwrap_or(ex.applies_to);
    let target = if applies == "product" { payload.target_product_id.or(ex.target_product_id) } else { None };

    validate_discount_fields(&d_type, val, min_amount, min_qty, start, end, max_uses, &applies, target)?;

    let updated = sqlx::query_as::<_, DiscountRule>(
        r#"
        UPDATE discount_rules
        SET name = $1, discount_type = $2, value = $3, min_purchase_amount = $4,
            min_quantity = $5, start_date = $6, end_date = $7, max_uses = $8,
            applies_to = $9, target_product_id = $10
        WHERE id = $11
        RETURNING id, name, discount_type, value, min_purchase_amount, min_quantity, start_date, end_date, max_uses, current_uses, applies_to, target_product_id, created_at
        "#,
    )
    .bind(payload.name.unwrap_or(ex.name).trim())
    .bind(&d_type)
    .bind(val)
    .bind(min_amount)
    .bind(min_qty)
    .bind(start)
    .bind(end)
    .bind(max_uses)
    .bind(&applies)
    .bind(target)
    .bind(id)
    .fetch_one(&pool)
    .await?;

    Ok(Json(updated))
}

pub async fn delete_discount_rule(
    _admin: RequireAdmin,
    Path(id): Path<Uuid>,
    State(pool): State<PgPool>,
) -> Result<Json<serde_json::Value>, AppError> {
    let res = sqlx::query("DELETE FROM discount_rules WHERE id = $1")
        .bind(id)
        .execute(&pool)
        .await?;

    if res.rows_affected() == 0 {
        return Err(AppError::NotFound(format!("Discount rule with ID {} not found", id)));
    }

    Ok(Json(json!({
        "success": true,
        "message": format!("Discount rule {} deleted successfully.", id),
        "id": id
    })))
}
