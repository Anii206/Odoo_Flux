use axum::{extract::State, Json};
use serde_json::json;
use sqlx::PgPool;

use crate::error::AppError;

pub async fn health_check(State(pool): State<PgPool>) -> Result<Json<serde_json::Value>, AppError> {
    sqlx::query("SELECT 1").execute(&pool).await?;
    Ok(Json(json!({
        "status": "healthy",
        "service": "Brightloop Subscription Management System - Backend",
        "version": "1.0.0",
        "postgres": "connected"
    })))
}
