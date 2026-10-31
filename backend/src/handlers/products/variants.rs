use axum::{
    extract::{Path, State},
    Json,
};
use rust_decimal::Decimal;
use serde::Deserialize;
use serde_json::json;
use sqlx::PgPool;
use uuid::Uuid;

use crate::{
    auth::{AuthenticatedUser, RequireAdmin},
    error::AppError,
    models::ProductVariant,
};

#[derive(Debug, Deserialize)]
pub struct CreateVariantRequest {
    pub attribute_name: String,
    pub attribute_value: String,
    pub price_extra: Decimal,
}

#[derive(Debug, Deserialize)]
pub struct UpdateVariantRequest {
    pub attribute_name: Option<String>,
    pub attribute_value: Option<String>,
    pub price_extra: Option<Decimal>,
}

pub async fn list_variants(
    _auth: AuthenticatedUser,
    Path(product_id): Path<Uuid>,
    State(pool): State<PgPool>,
) -> Result<Json<Vec<ProductVariant>>, AppError> {
    let variants = sqlx::query_as::<_, ProductVariant>(
        "SELECT id, product_id, attribute_name, attribute_value, price_extra, created_at FROM product_variants WHERE product_id = $1 ORDER BY created_at ASC",
    )
    .bind(product_id)
    .fetch_all(&pool)
    .await?;

    Ok(Json(variants))
}

pub async fn get_variant(
    _auth: AuthenticatedUser,
    Path((product_id, variant_id)): Path<(Uuid, Uuid)>,
    State(pool): State<PgPool>,
) -> Result<Json<ProductVariant>, AppError> {
    let variant = sqlx::query_as::<_, ProductVariant>(
        "SELECT id, product_id, attribute_name, attribute_value, price_extra, created_at FROM product_variants WHERE id = $1 AND product_id = $2",
    )
    .bind(variant_id)
    .bind(product_id)
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::NotFound(format!("Variant {} not found for product {}", variant_id, product_id)))?;

    Ok(Json(variant))
}

pub async fn create_variant(
    _admin: RequireAdmin,
    Path(product_id): Path<Uuid>,
    State(pool): State<PgPool>,
    Json(payload): Json<CreateVariantRequest>,
) -> Result<Json<ProductVariant>, AppError> {
    let exists = sqlx::query_scalar::<_, i64>("SELECT COUNT(*) FROM products WHERE id = $1")
        .bind(product_id)
        .fetch_one(&pool)
        .await?;
    if exists == 0 {
        return Err(AppError::NotFound(format!("Product with ID {} not found", product_id)));
    }

    let variant = sqlx::query_as::<_, ProductVariant>(
        r#"
        INSERT INTO product_variants (product_id, attribute_name, attribute_value, price_extra)
        VALUES ($1, $2, $3, $4)
        RETURNING id, product_id, attribute_name, attribute_value, price_extra, created_at
        "#,
    )
    .bind(product_id)
    .bind(payload.attribute_name.trim())
    .bind(payload.attribute_value.trim())
    .bind(payload.price_extra)
    .fetch_one(&pool)
    .await?;

    Ok(Json(variant))
}

pub async fn update_variant(
    _admin: RequireAdmin,
    Path((product_id, variant_id)): Path<(Uuid, Uuid)>,
    State(pool): State<PgPool>,
    Json(payload): Json<UpdateVariantRequest>,
) -> Result<Json<ProductVariant>, AppError> {
    let existing = sqlx::query_as::<_, ProductVariant>(
        "SELECT id, product_id, attribute_name, attribute_value, price_extra, created_at FROM product_variants WHERE id = $1 AND product_id = $2",
    )
    .bind(variant_id)
    .bind(product_id)
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::NotFound(format!("Variant with ID {} not found for product {}", variant_id, product_id)))?;

    let attribute_name = payload.attribute_name.unwrap_or(existing.attribute_name);
    let attribute_value = payload.attribute_value.unwrap_or(existing.attribute_value);
    let price_extra = payload.price_extra.unwrap_or(existing.price_extra);

    let updated = sqlx::query_as::<_, ProductVariant>(
        r#"
        UPDATE product_variants
        SET attribute_name = $1, attribute_value = $2, price_extra = $3
        WHERE id = $4
        RETURNING id, product_id, attribute_name, attribute_value, price_extra, created_at
        "#,
    )
    .bind(attribute_name.trim())
    .bind(attribute_value.trim())
    .bind(price_extra)
    .bind(variant_id)
    .fetch_one(&pool)
    .await?;

    Ok(Json(updated))
}

pub async fn delete_variant(
    _admin: RequireAdmin,
    Path((product_id, variant_id)): Path<(Uuid, Uuid)>,
    State(pool): State<PgPool>,
) -> Result<Json<serde_json::Value>, AppError> {
    let res = sqlx::query("DELETE FROM product_variants WHERE id = $1 AND product_id = $2")
        .bind(variant_id)
        .bind(product_id)
        .execute(&pool)
        .await?;

    if res.rows_affected() == 0 {
        return Err(AppError::NotFound(format!("Variant with ID {} not found for product {}", variant_id, product_id)));
    }

    Ok(Json(json!({
        "success": true,
        "message": format!("Variant {} deleted successfully.", variant_id),
        "id": variant_id
    })))
}
