use crate::error::AppError;

/// Custom Password Validator
/// Enforces > 8 characters, at least 1 uppercase, 
/// 1 lowercase, and 1 special character.
pub fn validate_password(password: &str) -> Result<(), AppError> {
    if password.chars().count() <= 8 {
        return Err(AppError::BadRequest(
            "Password must be strictly greater than 8 characters in length.".to_string(),
        ));
    }
    let has_uppercase = password.chars().any(|c| c.is_ascii_uppercase());
    if !has_uppercase {
        return Err(AppError::BadRequest(
            "Password must contain at least 1 uppercase letter.".to_string(),
        ));
    }
    let has_lowercase = password.chars().any(|c| c.is_ascii_lowercase());
    if !has_lowercase {
        return Err(AppError::BadRequest(
            "Password must contain at least 1 lowercase letter.".to_string(),
        ));
    }
    let has_special = password
        .chars()
        .any(|c| !c.is_alphanumeric() && !c.is_whitespace());
    if !has_special {
        return Err(AppError::BadRequest(
            "Password must contain at least 1 special character (e.g. !@#$%^&*).".to_string(),
        ));
    }
    Ok(())
}
