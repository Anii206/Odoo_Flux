use axum::{extract::State, Json};
use sqlx::PgPool;
use uuid::Uuid;

use crate::{
    auth::RequireStaffOrAdmin,
    error::AppError,
    models::UserSummary,
};

pub async fn list_users(
    _caller: RequireStaffOrAdmin,
    State(pool): State<PgPool>,
) -> Result<Json<Vec<UserSummary>>, AppError> {
    let users = sqlx::query_as::<_, (Uuid, String, String, chrono::DateTime<chrono::Utc>)>(
        "SELECT id, email, role, created_at FROM users ORDER BY created_at DESC",
    )
    .fetch_all(&pool)
    .await?
    .into_iter()
    .map(|(id, email, role, created_at)| UserSummary {
        id,
        email,
        role,
        created_at,
    })
    .collect();

    Ok(Json(users))
}
