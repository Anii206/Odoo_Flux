use axum::{
    extract::{Path, State},
    Json,
};
use serde_json::json;
use sqlx::PgPool;
use uuid::Uuid;

use crate::{
    auth::RequireAdmin,
    error::AppError,
    handlers::products::types::{CreateProductRequest, ProductWithVariants, UpdateProductRequest},
    models::{Product, ProductVariant},
};

pub async fn create_product(
    _admin: RequireAdmin,
    State(pool): State<PgPool>,
    Json(payload): Json<CreateProductRequest>,
) -> Result<Json<ProductWithVariants>, AppError> {
    if payload.name.trim().is_empty() {
        return Err(AppError::BadRequest("Product name is required.".to_string()));
    }
    if !["software", "addon", "service"].contains(&payload.product_type.as_str()) {
        return Err(AppError::BadRequest(
            "product_type must be one of: 'software', 'addon', 'service'.".to_string(),
        ));
    }

    let mut tx = pool.begin().await?;
    let product = sqlx::query_as::<_, Product>(
        r#"
        INSERT INTO products (name, product_type, sales_price, cost_price, notes)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, name, product_type, sales_price, cost_price, notes, created_at
        "#,
    )
    .bind(payload.name.trim())
    .bind(&payload.product_type)
    .bind(payload.sales_price)
    .bind(payload.cost_price)
    .bind(payload.notes)
    .fetch_one(&mut *tx)
    .await?;

    let mut variants = Vec::new();
    if let Some(incoming_variants) = payload.variants {
        for v in incoming_variants {
            let variant = sqlx::query_as::<_, ProductVariant>(
                r#"
                INSERT INTO product_variants (product_id, attribute_name, attribute_value, price_extra)
                VALUES ($1, $2, $3, $4)
                RETURNING id, product_id, attribute_name, attribute_value, price_extra, created_at
                "#,
            )
            .bind(product.id)
            .bind(v.attribute_name.trim())
            .bind(v.attribute_value.trim())
            .bind(v.price_extra)
            .fetch_one(&mut *tx)
            .await?;
            variants.push(variant);
        }
    }
    tx.commit().await?;

    Ok(Json(ProductWithVariants { product, variants }))
}

pub async fn update_product(
    _admin: RequireAdmin,
    Path(id): Path<Uuid>,
    State(pool): State<PgPool>,
    Json(payload): Json<UpdateProductRequest>,
) -> Result<Json<ProductWithVariants>, AppError> {
    let existing = sqlx::query_as::<_, Product>(
        "SELECT id, name, product_type, sales_price, cost_price, notes, created_at FROM products WHERE id = $1",
    )
    .bind(id)
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::NotFound(format!("Product with ID {} not found", id)))?;

    let name = payload.name.unwrap_or(existing.name);
    let product_type = payload.product_type.unwrap_or(existing.product_type);
    let sales_price = payload.sales_price.unwrap_or(existing.sales_price);
    let cost_price = payload.cost_price.unwrap_or(existing.cost_price);
    let notes = payload.notes.or(existing.notes);

    if !["software", "addon", "service"].contains(&product_type.as_str()) {
        return Err(AppError::BadRequest(
            "product_type must be one of: 'software', 'addon', 'service'.".to_string(),
        ));
    }

    let updated_product = sqlx::query_as::<_, Product>(
        r#"
        UPDATE products
        SET name = $1, product_type = $2, sales_price = $3, cost_price = $4, notes = $5
        WHERE id = $6
        RETURNING id, name, product_type, sales_price, cost_price, notes, created_at
        "#,
    )
    .bind(name.trim())
    .bind(&product_type)
    .bind(sales_price)
    .bind(cost_price)
    .bind(notes)
    .bind(id)
    .fetch_one(&pool)
    .await?;

    let variants = sqlx::query_as::<_, ProductVariant>(
        "SELECT id, product_id, attribute_name, attribute_value, price_extra, created_at FROM product_variants WHERE product_id = $1 ORDER BY created_at ASC",
    )
    .bind(id)
    .fetch_all(&pool)
    .await?;

    Ok(Json(ProductWithVariants { product: updated_product, variants }))
}

pub async fn delete_product(
    _admin: RequireAdmin,
    Path(id): Path<Uuid>,
    State(pool): State<PgPool>,
) -> Result<Json<serde_json::Value>, AppError> {
    let res = sqlx::query("DELETE FROM products WHERE id = $1")
        .bind(id)
        .execute(&pool)
        .await?;

    if res.rows_affected() == 0 {
        return Err(AppError::NotFound(format!("Product with ID {} not found", id)));
    }

    Ok(Json(json!({
        "success": true,
        "message": format!("Product {} deleted successfully.", id),
        "id": id
    })))
}
