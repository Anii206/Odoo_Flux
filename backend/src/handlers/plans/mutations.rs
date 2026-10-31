use axum::{
    extract::{Path, State},
    Json,
};
use rust_decimal::Decimal;
use serde::Deserialize;
use serde_json::json;
use sqlx::PgPool;
use uuid::Uuid;

use crate::{
    auth::RequireAdmin,
    error::AppError,
    models::Plan,
};

#[derive(Debug, Deserialize)]
pub struct CreatePlanRequest {
    pub name: String,
    pub billing_interval: String,
    pub plan_price: Decimal,
    pub min_quantity: Option<i32>,
    pub available_from: chrono::NaiveDate,
    pub available_to: Option<chrono::NaiveDate>,
    pub auto_close: Option<bool>,
    pub allow_early_close: Option<bool>,
    pub allow_pause: Option<bool>,
    pub allow_renew: Option<bool>,
}

#[derive(Debug, Deserialize)]
pub struct UpdatePlanRequest {
    pub name: Option<String>,
    pub billing_interval: Option<String>,
    pub plan_price: Option<Decimal>,
    pub min_quantity: Option<i32>,
    pub available_from: Option<chrono::NaiveDate>,
    pub available_to: Option<chrono::NaiveDate>,
    pub auto_close: Option<bool>,
    pub allow_early_close: Option<bool>,
    pub allow_pause: Option<bool>,
    pub allow_renew: Option<bool>,
}

pub async fn create_plan(
    _admin: RequireAdmin,
    State(pool): State<PgPool>,
    Json(payload): Json<CreatePlanRequest>,
) -> Result<Json<Plan>, AppError> {
    if !["daily", "weekly", "monthly", "yearly"].contains(&payload.billing_interval.as_str()) {
        return Err(AppError::BadRequest(
            "billing_interval must be 'daily', 'weekly', 'monthly', or 'yearly'.".to_string(),
        ));
    }
    if payload.plan_price < Decimal::ZERO {
        return Err(AppError::BadRequest("plan_price cannot be negative.".to_string()));
    }

    let plan = sqlx::query_as::<_, Plan>(
        r#"
        INSERT INTO plans (
            name, billing_interval, plan_price, min_quantity,
            available_from, available_to, auto_close,
            allow_early_close, allow_pause, allow_renew
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id, name, billing_interval, plan_price, min_quantity, available_from, available_to, auto_close, allow_early_close, allow_pause, allow_renew, created_at
        "#,
    )
    .bind(payload.name.trim())
    .bind(&payload.billing_interval)
    .bind(payload.plan_price)
    .bind(payload.min_quantity.unwrap_or(1))
    .bind(payload.available_from)
    .bind(payload.available_to)
    .bind(payload.auto_close.unwrap_or(false))
    .bind(payload.allow_early_close.unwrap_or(true))
    .bind(payload.allow_pause.unwrap_or(true))
    .bind(payload.allow_renew.unwrap_or(true))
    .fetch_one(&pool)
    .await?;

    Ok(Json(plan))
}

pub async fn update_plan(
    _admin: RequireAdmin,
    Path(id): Path<Uuid>,
    State(pool): State<PgPool>,
    Json(payload): Json<UpdatePlanRequest>,
) -> Result<Json<Plan>, AppError> {
    let existing = sqlx::query_as::<_, Plan>(
        "SELECT id, name, billing_interval, plan_price, min_quantity, available_from, available_to, auto_close, allow_early_close, allow_pause, allow_renew, created_at FROM plans WHERE id = $1",
    )
    .bind(id)
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::NotFound(format!("Plan with ID {} not found", id)))?;

    let interval = payload.billing_interval.unwrap_or(existing.billing_interval);
    if !["daily", "weekly", "monthly", "yearly"].contains(&interval.as_str()) {
        return Err(AppError::BadRequest(
            "billing_interval must be 'daily', 'weekly', 'monthly', or 'yearly'.".to_string(),
        ));
    }

    let updated = sqlx::query_as::<_, Plan>(
        r#"
        UPDATE plans
        SET name = $1, billing_interval = $2, plan_price = $3, min_quantity = $4,
            available_from = $5, available_to = $6, auto_close = $7,
            allow_early_close = $8, allow_pause = $9, allow_renew = $10
        WHERE id = $11
        RETURNING id, name, billing_interval, plan_price, min_quantity, available_from, available_to, auto_close, allow_early_close, allow_pause, allow_renew, created_at
        "#,
    )
    .bind(payload.name.unwrap_or(existing.name).trim())
    .bind(&interval)
    .bind(payload.plan_price.unwrap_or(existing.plan_price))
    .bind(payload.min_quantity.unwrap_or(existing.min_quantity))
    .bind(payload.available_from.unwrap_or(existing.available_from))
    .bind(payload.available_to.or(existing.available_to))
    .bind(payload.auto_close.unwrap_or(existing.auto_close))
    .bind(payload.allow_early_close.unwrap_or(existing.allow_early_close))
    .bind(payload.allow_pause.unwrap_or(existing.allow_pause))
    .bind(payload.allow_renew.unwrap_or(existing.allow_renew))
    .bind(id)
    .fetch_one(&pool)
    .await?;

    Ok(Json(updated))
}

pub async fn delete_plan(
    _admin: RequireAdmin,
    Path(id): Path<Uuid>,
    State(pool): State<PgPool>,
) -> Result<Json<serde_json::Value>, AppError> {
    let res = sqlx::query("DELETE FROM plans WHERE id = $1")
        .bind(id)
        .execute(&pool)
        .await?;

    if res.rows_affected() == 0 {
        return Err(AppError::NotFound(format!("Plan with ID {} not found", id)));
    }

    Ok(Json(json!({
        "success": true,
        "message": format!("Plan {} deleted successfully.", id),
        "id": id
    })))
}
