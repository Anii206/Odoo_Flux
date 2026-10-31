use argon2::{
    password_hash::{rand_core::OsRng, PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
    Argon2,
};
use chrono::{Duration, Utc};
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use uuid::Uuid;

use crate::{error::AppError, models::Claims};

use std::sync::OnceLock;

static JWT_SECRET_CACHE: OnceLock<Vec<u8>> = OnceLock::new();

pub fn get_jwt_secret() -> &'static [u8] {
    JWT_SECRET_CACHE.get_or_init(|| {
        let secret = std::env::var("JWT_SECRET").expect(
            "FATAL: JWT_SECRET environment variable is missing. A secure random secret is required.",
        );
        if secret.trim().len() < 32 {
            panic!("FATAL: JWT_SECRET must be at least 32 characters long.");
        }
        secret.into_bytes()
    })
}

// ==========================================
// Argon2 Hashing & Verification
// ==========================================
pub fn hash_password(password: &str) -> Result<String, AppError> {
    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();
    let password_hash = argon2
        .hash_password(password.as_bytes(), &salt)
        .map_err(|e| AppError::Internal(format!("Failed to hash password: {}", e)))?
        .to_string();
    Ok(password_hash)
}

pub fn verify_password(hash: &str, password: &str) -> Result<bool, AppError> {
    let parsed_hash = PasswordHash::new(hash)
        .map_err(|e| AppError::Internal(format!("Invalid password hash: {}", e)))?;
    Ok(Argon2::default()
        .verify_password(password.as_bytes(), &parsed_hash)
        .is_ok())
}

// ==========================================
// HMAC-SHA256 JWT Handling
// ==========================================
pub fn generate_jwt(user_id: &Uuid, email: &str, role: &str) -> Result<String, AppError> {
    let expiration = Utc::now()
        .checked_add_signed(Duration::hours(24))
        .expect("Valid timestamp")
        .timestamp() as usize;

    let claims = Claims {
        sub: user_id.to_string(),
        email: email.to_string(),
        role: role.to_string(),
        exp: expiration,
    };

    encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(get_jwt_secret()),
    )
    .map_err(|e| AppError::Internal(format!("Failed to generate JWT: {}", e)))
}

pub fn decode_jwt(token: &str) -> Result<Claims, AppError> {
    let token_data = decode::<Claims>(
        token,
        &DecodingKey::from_secret(get_jwt_secret()),
        &Validation::default(),
    )
    .map_err(|_| AppError::Auth("Invalid or expired session token. Please log in again.".to_string()))?;

    Ok(token_data.claims)
}
