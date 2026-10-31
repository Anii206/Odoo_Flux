use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde_json::json;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum AppError {
    #[error("Authentication failed: {0}")]
    Auth(String),

    #[error("Forbidden: {0}")]
    Forbidden(String),

    #[error("Not found: {0}")]
    NotFound(String),

    #[error("Bad request: {0}")]
    BadRequest(String),

    #[error("Conflict: {0}")]
    Conflict(String),

    #[error("Database error: {0}")]
    Database(#[from] sqlx::Error),

    #[error("Internal server error: {0}")]
    Internal(String),
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, error_message) = match &self {
            AppError::Auth(msg) => (StatusCode::UNAUTHORIZED, msg.clone()),
            AppError::Forbidden(msg) => (StatusCode::FORBIDDEN, msg.clone()),
            AppError::NotFound(msg) => (StatusCode::NOT_FOUND, msg.clone()),
            AppError::BadRequest(msg) => (StatusCode::BAD_REQUEST, msg.clone()),
            AppError::Conflict(msg) => (StatusCode::CONFLICT, msg.clone()),
            AppError::Database(err) => {
                tracing::error!("Database query error: {:?}", err);
                if let sqlx::Error::Database(db_err) = err {
                    if let Some(constraint) = db_err.constraint() {
                        if constraint == "uq_sub_billing_start" {
                            let (status, msg) = (
                                StatusCode::CONFLICT,
                                "Anti-double-billing protection: This subscription has already been billed for this billing period (start date duplicate).".to_string(),
                            );
                            let body = Json(json!({ "error": msg, "status": status.as_u16() }));
                            return (status, body).into_response();
                        }
                    }
                    if db_err.code().as_deref() == Some("23503") {
                        (
                            StatusCode::CONFLICT,
                            "Cannot delete or modify record: it is referenced by existing data (foreign key constraint).".to_string(),
                        )
                    } else if db_err.is_unique_violation() {
                        (
                            StatusCode::CONFLICT,
                            "A record with this information already exists.".to_string(),
                        )
                    } else {
                        (
                            StatusCode::INTERNAL_SERVER_ERROR,
                            "Database operation failed.".to_string(),
                        )
                    }
                } else {
                    (
                        StatusCode::INTERNAL_SERVER_ERROR,
                        "Internal database error.".to_string(),
                    )
                }
            }
            AppError::Internal(msg) => {
                tracing::error!("Internal error: {}", msg);
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "An unexpected error occurred.".to_string(),
                )
            }
        };

        let body = Json(json!({
            "error": error_message,
            "status": status.as_u16()
        }));

        (status, body).into_response()
    }
}
