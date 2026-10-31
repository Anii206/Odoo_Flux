use axum::{
    extract::{Path, State},
    Json,
};
use sqlx::PgPool;
use uuid::Uuid;

use crate::{
    auth::AuthenticatedUser,
    error::AppError,
    handlers::products::types::ProductWithVariants,
    models::{Product, ProductVariant},
};

pub async fn list_products(
    _auth: AuthenticatedUser,
    State(pool): State<PgPool>,
) -> Result<Json<Vec<ProductWithVariants>>, AppError> {
    let products = sqlx::query_as::<_, Product>(
        "SELECT id, name, product_type, sales_price, cost_price, notes, created_at FROM products ORDER BY created_at DESC",
    )
    .fetch_all(&pool)
    .await?;

    let variants = sqlx::query_as::<_, ProductVariant>(
        "SELECT id, product_id, attribute_name, attribute_value, price_extra, created_at FROM product_variants ORDER BY created_at ASC",
    )
    .fetch_all(&pool)
    .await?;

    let result = products
        .into_iter()
        .map(|p| {
            let p_variants = variants.iter().filter(|v| v.product_id == p.id).cloned().collect();
            ProductWithVariants { product: p, variants: p_variants }
        })
        .collect();

    Ok(Json(result))
}

pub async fn get_product(
    _auth: AuthenticatedUser,
    Path(id): Path<Uuid>,
    State(pool): State<PgPool>,
) -> Result<Json<ProductWithVariants>, AppError> {
    let product = sqlx::query_as::<_, Product>(
        "SELECT id, name, product_type, sales_price, cost_price, notes, created_at FROM products WHERE id = $1",
    )
    .bind(id)
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::NotFound(format!("Product with ID {} not found", id)))?;

    let variants = sqlx::query_as::<_, ProductVariant>(
        "SELECT id, product_id, attribute_name, attribute_value, price_extra, created_at FROM product_variants WHERE product_id = $1 ORDER BY created_at ASC",
    )
    .bind(id)
    .fetch_all(&pool)
    .await?;

    Ok(Json(ProductWithVariants { product, variants }))
}
