use axum::{extract::State, Json};
use sqlx::PgPool;

use crate::{
    auth::RequireStaffOrAdmin,
    billing::{
        engine::run_billing_cycle,
        types::{BillingRunResult, TriggerBillingRequest},
    },
    error::AppError,
};

pub async fn trigger_billing_run(
    _staff: RequireStaffOrAdmin,
    State(pool): State<PgPool>,
    Json(payload): Json<TriggerBillingRequest>,
) -> Result<Json<BillingRunResult>, AppError> {
    let target = payload.target_date.unwrap_or_else(|| chrono::Utc::now().date_naive());
    let result = run_billing_cycle(&pool, target).await?;
    Ok(Json(result))
}
