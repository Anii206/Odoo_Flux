#![allow(dead_code)]

use axum::{
    extract::FromRequestParts,
    http::request::Parts,
};
use uuid::Uuid;

use crate::error::AppError;
use super::crypto::decode_jwt;

#[derive(Debug, Clone)]
pub struct AuthenticatedUser {
    pub id: Uuid,
    pub email: String,
    pub role: String,
}

impl<S> FromRequestParts<S> for AuthenticatedUser
where
    S: Send + Sync,
{
    type Rejection = AppError;

    async fn from_request_parts(parts: &mut Parts, _state: &S) -> Result<Self, Self::Rejection> {
        let token = if let Some(auth_header) = parts
            .headers
            .get(axum::http::header::AUTHORIZATION)
            .and_then(|h| h.to_str().ok())
        {
            auth_header
                .strip_prefix("Bearer ")
                .ok_or_else(|| AppError::Auth("Authorization header must use Bearer schema".to_string()))?
        } else if let Some(query) = parts.uri.query() {
            query
                .split('&')
                .find_map(|pair| {
                    let mut split = pair.split('=');
                    if split.next() == Some("token") {
                        split.next()
                    } else {
                        None
                    }
                })
                .ok_or_else(|| AppError::Auth("Missing Authorization header or token query parameter".to_string()))?
        } else {
            return Err(AppError::Auth("Missing Authorization header".to_string()));
        };

        let claims = decode_jwt(token)?;
        let id = Uuid::parse_str(&claims.sub)
            .map_err(|_| AppError::Auth("Invalid user ID in token claim".to_string()))?;

        Ok(AuthenticatedUser {
            id,
            email: claims.email,
            role: claims.role,
        })
    }
}

#[derive(Debug, Clone)]
pub struct RequireAdmin(pub AuthenticatedUser);

impl<S> FromRequestParts<S> for RequireAdmin
where
    S: Send + Sync,
{
    type Rejection = AppError;

    async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
        let user = AuthenticatedUser::from_request_parts(parts, state).await?;
        if user.role != "admin" {
            return Err(AppError::Forbidden(
                "Access denied: Admin role required for this action.".to_string(),
            ));
        }
        Ok(RequireAdmin(user))
    }
}

#[derive(Debug, Clone)]
pub struct RequireStaffOrAdmin(pub AuthenticatedUser);

impl<S> FromRequestParts<S> for RequireStaffOrAdmin
where
    S: Send + Sync,
{
    type Rejection = AppError;

    async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
        let user = AuthenticatedUser::from_request_parts(parts, state).await?;
        if user.role != "admin" && user.role != "staff" {
            return Err(AppError::Forbidden(
                "Access denied: Staff or Admin role required for this action.".to_string(),
            ));
        }
        Ok(RequireStaffOrAdmin(user))
    }
}
