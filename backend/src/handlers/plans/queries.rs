use axum::{
    extract::{Path, State},
    Json,
};
use sqlx::PgPool;
use uuid::Uuid;

use crate::{
    auth::AuthenticatedUser,
    error::AppError,
    models::Plan,
};

pub async fn list_plans(
    _auth: AuthenticatedUser,
    State(pool): State<PgPool>,
) -> Result<Json<Vec<Plan>>, AppError> {
    let plans = sqlx::query_as::<_, Plan>(
        "SELECT id, name, billing_interval, plan_price, min_quantity, available_from, available_to, auto_close, allow_early_close, allow_pause, allow_renew, created_at FROM plans ORDER BY created_at DESC",
    )
    .fetch_all(&pool)
    .await?;

    Ok(Json(plans))
}

pub async fn get_plan(
    _auth: AuthenticatedUser,
    Path(id): Path<Uuid>,
    State(pool): State<PgPool>,
) -> Result<Json<Plan>, AppError> {
    let plan = sqlx::query_as::<_, Plan>(
        "SELECT id, name, billing_interval, plan_price, min_quantity, available_from, available_to, auto_close, allow_early_close, allow_pause, allow_renew, created_at FROM plans WHERE id = $1",
    )
    .bind(id)
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::NotFound(format!("Plan with ID {} not found", id)))?;

    Ok(Json(plan))
}
