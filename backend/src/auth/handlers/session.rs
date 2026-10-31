use axum::{extract::State, Json};
use sqlx::PgPool;
use uuid::Uuid;

use crate::{
    error::AppError,
    models::{AuthResponse, LoginRequest, SignupRequest, User, UserSummary},
};
use crate::auth::{
    crypto::{generate_jwt, hash_password, verify_password},
    extractors::AuthenticatedUser,
    validator::validate_password,
};

/// POST /api/auth/signup - Creates customer account
pub async fn signup(
    State(pool): State<PgPool>,
    Json(payload): Json<SignupRequest>,
) -> Result<Json<AuthResponse>, AppError> {
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
    let role = "customer";

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

    let token = generate_jwt(&user.id, &user.email, &user.role)?;

    Ok(Json(AuthResponse {
        token,
        user: UserSummary {
            id: user.id,
            email: user.email,
            role: user.role,
            created_at: user.created_at,
        },
    }))
}

/// POST /api/auth/login - Returns custom HMAC-SHA256 JWT
pub async fn login(
    State(pool): State<PgPool>,
    Json(payload): Json<LoginRequest>,
) -> Result<Json<AuthResponse>, AppError> {
    let email = payload.email.trim().to_lowercase();
    if email.is_empty() {
        return Err(AppError::BadRequest("Email is required.".to_string()));
    }

    let user = sqlx::query_as::<_, User>(
        "SELECT id, email, password_hash, role, reset_token, reset_token_expires_at, created_at FROM users WHERE email = $1",
    )
    .bind(&email)
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::Auth("Invalid email or password.".to_string()))?;

    let valid = verify_password(&user.password_hash, &payload.password)?;
    if !valid {
        return Err(AppError::Auth("Invalid email or password.".to_string()));
    }

    let token = generate_jwt(&user.id, &user.email, &user.role)?;

    Ok(Json(AuthResponse {
        token,
        user: UserSummary {
            id: user.id,
            email: user.email,
            role: user.role,
            created_at: user.created_at,
        },
    }))
}

/// GET /api/auth/me - Current logged-in user profile
pub async fn me(
    auth: AuthenticatedUser,
    State(pool): State<PgPool>,
) -> Result<Json<UserSummary>, AppError> {
    let user = sqlx::query_as::<_, User>(
        "SELECT id, email, password_hash, role, reset_token, reset_token_expires_at, created_at FROM users WHERE id = $1",
    )
    .bind(auth.id)
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::NotFound("User not found".to_string()))?;

    Ok(Json(UserSummary {
        id: user.id,
        email: user.email,
        role: user.role,
        created_at: user.created_at,
    }))
}
