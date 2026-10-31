use axum::{extract::State, Json};
use sqlx::PgPool;
use uuid::Uuid;

use crate::{
    auth::{
        crypto::hash_password,
        extractors::RequireAdmin,
        validator::validate_password,
    },
    error::AppError,
    models::{CreateStaffRequest, User, UserSummary},
};

/// POST /api/admin/staff - Admin-only endpoint to create internal staff accounts
pub async fn create_staff(
    _admin: RequireAdmin,
    State(pool): State<PgPool>,
    Json(payload): Json<CreateStaffRequest>,
) -> Result<Json<UserSummary>, AppError> {
    let email = payload.email.trim().to_lowercase();
    if email.is_empty() || !email.contains('@') {
        return Err(AppError::BadRequest("A valid email address is required.".to_string()));
    }

    validate_password(&payload.password)?;

    let existing = sqlx::query_scalar::<_, i64>("SELECT COUNT(*) FROM users WHERE email = $1")
        .bind(&email)
        .fetch_one(&pool)
        .await?;

    if existing > 0 {
        return Err(AppError::Conflict("An account with this email address already exists.".to_string()));
    }

    let password_hash = hash_password(&payload.password)?;
    let user_id = Uuid::new_v4();
    let role = "staff";

    let user = sqlx::query_as::<_, User>(
        r#"
        INSERT INTO users (id, email, password_hash, role)
        VALUES ($1, $2, $3, $4)
        RETURNING id, email, password_hash, role, reset_token, reset_token_expires_at, created_at
        "#,
    )
    .bind(user_id)
    .bind(&email)
    .bind(&password_hash)
    .bind(role)
    .fetch_one(&pool)
    .await?;

    Ok(Json(UserSummary {
        id: user.id,
        email: user.email,
        role: user.role,
        created_at: user.created_at,
    }))
}
