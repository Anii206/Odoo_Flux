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
    auth::{AuthenticatedUser, RequireAdmin},
    error::AppError,
    models::TaxRule,
};

#[derive(Debug, Deserialize)]
pub struct CreateTaxRuleRequest {
    pub name: String,
    pub rate_percentage: Decimal,
    pub is_active: Option<bool>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateTaxRuleRequest {
    pub name: Option<String>,
    pub rate_percentage: Option<Decimal>,
    pub is_active: Option<bool>,
}

pub async fn list_tax_rules(
    _auth: AuthenticatedUser,
    State(pool): State<PgPool>,
) -> Result<Json<Vec<TaxRule>>, AppError> {
    let rules = sqlx::query_as::<_, TaxRule>(
        "SELECT id, name, rate_percentage, is_active, created_at FROM tax_rules ORDER BY created_at DESC",
    )
    .fetch_all(&pool)
    .await?;

    Ok(Json(rules))
}

pub async fn get_tax_rule(
    _auth: AuthenticatedUser,
    Path(id): Path<Uuid>,
    State(pool): State<PgPool>,
) -> Result<Json<TaxRule>, AppError> {
    let rule = sqlx::query_as::<_, TaxRule>(
        "SELECT id, name, rate_percentage, is_active, created_at FROM tax_rules WHERE id = $1",
    )
    .bind(id)
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::NotFound(format!("Tax rule with ID {} not found", id)))?;

    Ok(Json(rule))
}

pub async fn create_tax_rule(
    _admin: RequireAdmin,
    State(pool): State<PgPool>,
    Json(payload): Json<CreateTaxRuleRequest>,
) -> Result<Json<TaxRule>, AppError> {
    if payload.name.trim().is_empty() {
        return Err(AppError::BadRequest("Tax rule name is required.".to_string()));
    }
    if payload.rate_percentage < Decimal::ZERO || payload.rate_percentage > Decimal::from(100) {
        return Err(AppError::BadRequest(
            "rate_percentage must be between 0.00 and 100.00%.".to_string(),
        ));
    }

    let rule = sqlx::query_as::<_, TaxRule>(
        r#"
        INSERT INTO tax_rules (name, rate_percentage, is_active)
        VALUES ($1, $2, $3)
        RETURNING id, name, rate_percentage, is_active, created_at
        "#,
    )
    .bind(payload.name.trim())
    .bind(payload.rate_percentage)
    .bind(payload.is_active.unwrap_or(true))
    .fetch_one(&pool)
    .await?;

    Ok(Json(rule))
}

pub async fn update_tax_rule(
    _admin: RequireAdmin,
    Path(id): Path<Uuid>,
    State(pool): State<PgPool>,
    Json(payload): Json<UpdateTaxRuleRequest>,
) -> Result<Json<TaxRule>, AppError> {
    let existing = sqlx::query_as::<_, TaxRule>(
        "SELECT id, name, rate_percentage, is_active, created_at FROM tax_rules WHERE id = $1",
    )
    .bind(id)
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::NotFound(format!("Tax rule with ID {} not found", id)))?;

    let rate = payload.rate_percentage.unwrap_or(existing.rate_percentage);
    if rate < Decimal::ZERO || rate > Decimal::from(100) {
        return Err(AppError::BadRequest(
            "rate_percentage must be between 0.00 and 100.00%.".to_string(),
        ));
    }

    let updated = sqlx::query_as::<_, TaxRule>(
        r#"
        UPDATE tax_rules
        SET name = $1, rate_percentage = $2, is_active = $3
        WHERE id = $4
        RETURNING id, name, rate_percentage, is_active, created_at
        "#,
    )
    .bind(payload.name.unwrap_or(existing.name).trim())
    .bind(rate)
    .bind(payload.is_active.unwrap_or(existing.is_active))
    .bind(id)
    .fetch_one(&pool)
    .await?;

    Ok(Json(updated))
}

pub async fn delete_tax_rule(
    _admin: RequireAdmin,
    Path(id): Path<Uuid>,
    State(pool): State<PgPool>,
) -> Result<Json<serde_json::Value>, AppError> {
    let res = sqlx::query("DELETE FROM tax_rules WHERE id = $1")
        .bind(id)
        .execute(&pool)
        .await?;

    if res.rows_affected() == 0 {
        return Err(AppError::NotFound(format!("Tax rule with ID {} not found", id)));
    }

    Ok(Json(json!({
        "success": true,
        "message": format!("Tax rule {} deleted successfully.", id),
        "id": id
    })))
}
