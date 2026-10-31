use axum::{extract::State, Json};
use chrono::{Duration, Utc};
use serde_json::json;
use sqlx::PgPool;
use uuid::Uuid;

use crate::{
    auth::{
        crypto::hash_password,
        validator::validate_password,
    },
    error::AppError,
    models::{ForgotPasswordRequest, LocalEmail, ResetPasswordRequest, User},
};

/// POST /api/auth/forgot-password - Generates token and writes reset link into local_emails table
pub async fn forgot_password(
    State(pool): State<PgPool>,
    Json(payload): Json<ForgotPasswordRequest>,
) -> Result<Json<serde_json::Value>, AppError> {
    let email = payload.email.trim().to_lowercase();
    if email.is_empty() {
        return Err(AppError::BadRequest("Email is required.".to_string()));
    }

    let user_opt = sqlx::query_as::<_, User>(
        "SELECT id, email, password_hash, role, reset_token, reset_token_expires_at, created_at FROM users WHERE email = $1",
    )
    .bind(&email)
    .fetch_optional(&pool)
    .await?;

    if let Some(user) = user_opt {
        let reset_token = format!("{}-{}", Uuid::new_v4(), Uuid::new_v4().simple());
        let expires_at = Utc::now() + Duration::hours(1);

        sqlx::query(
            "UPDATE users SET reset_token = $1, reset_token_expires_at = $2 WHERE id = $3",
        )
        .bind(&reset_token)
        .bind(expires_at)
        .bind(user.id)
        .execute(&pool)
        .await?;

        let reset_url = format!("http://localhost:5173/reset-password?token={}", reset_token);
        let subject = "Reset Your Password - Brightloop Subscription Management";
        let body_html = format!(
            r#"<!DOCTYPE html>
<html>
<head>
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; }}
    .container {{ max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }}
    .btn {{ display: inline-block; background-color: #4f46e5; color: #ffffff !important; padding: 12px 24px; font-weight: 600; text-decoration: none; border-radius: 8px; margin: 20px 0; }}
    .footer {{ font-size: 12px; color: #64748b; margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 16px; }}
  </style>
</head>
<body>
  <div class="container">
    <h2 style="color: #0f172a; margin-top: 0;">Brightloop Password Reset</h2>
    <p style="color: #334155; font-size: 15px; line-height: 1.5;">Hello,</p>
    <p style="color: #334155; font-size: 15px; line-height: 1.5;">We received a request to reset your password for your Brightloop account. Click the button below to choose a new password:</p>
    <div style="text-align: center;">
      <a href="{}" class="btn">Reset Password</a>
    </div>
    <p style="color: #64748b; font-size: 13px;">Or copy and paste this link into your browser:<br/><span style="color: #4f46e5; word-break: break-all;">{}</span></p>
    <p style="color: #64748b; font-size: 13px;">This link will expire in 1 hour. If you did not request this, you can safely ignore this email.</p>
    <div class="footer">
      Brightloop Subscription Management System &bull; Self-hosted Outbox Service
    </div>
  </div>
</body>
</html>"#,
            reset_url, reset_url
        );

        sqlx::query(
            "INSERT INTO local_emails (recipient_email, subject, body_html) VALUES ($1, $2, $3)",
        )
        .bind(&user.email)
        .bind(subject)
        .bind(&body_html)
        .execute(&pool)
        .await?;
    }

    Ok(Json(json!({
        "message": "If an account with that email exists, password reset instructions have been sent to your local outbox.",
        "success": true
    })))
}

/// POST /api/auth/reset-password
pub async fn reset_password(
    State(pool): State<PgPool>,
    Json(payload): Json<ResetPasswordRequest>,
) -> Result<Json<serde_json::Value>, AppError> {
    let token = payload.token.trim();
    if token.is_empty() {
        return Err(AppError::BadRequest("Reset token is required.".to_string()));
    }

    validate_password(&payload.new_password)?;

    let now = Utc::now();
    let user_opt = sqlx::query_as::<_, User>(
        r#"
        SELECT id, email, password_hash, role, reset_token, reset_token_expires_at, created_at
        FROM users
        WHERE reset_token = $1 AND reset_token_expires_at > $2
        "#,
    )
    .bind(token)
    .bind(now)
    .fetch_optional(&pool)
    .await?;

    let user = match user_opt {
        Some(u) => u,
        None => {
            return Err(AppError::BadRequest(
                "Invalid or expired password reset token. Please request a new one.".to_string(),
            ))
        }
    };

    let new_hash = hash_password(&payload.new_password)?;

    sqlx::query(
        "UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expires_at = NULL WHERE id = $2",
    )
    .bind(&new_hash)
    .bind(user.id)
    .execute(&pool)
    .await?;

    Ok(Json(json!({
        "message": "Password has been successfully updated. You may now log in.",
        "success": true
    })))
}

/// GET /api/dev/emails - View sent password reset emails in the UI (Admin & Dev only)
pub async fn get_dev_emails(
    _admin: crate::auth::RequireAdmin,
    State(pool): State<PgPool>,
) -> Result<Json<Vec<LocalEmail>>, AppError> {
    let app_env = std::env::var("APP_ENV").unwrap_or_else(|_| "production".to_string());
    if app_env.to_lowercase() != "development" {
        return Err(AppError::NotFound("Endpoint not found.".to_string()));
    }

    let emails = sqlx::query_as::<_, LocalEmail>(
        "SELECT id, recipient_email, subject, body_html, created_at FROM local_emails ORDER BY created_at DESC LIMIT 50",
    )
    .fetch_all(&pool)
    .await?;

    Ok(Json(emails))
}
