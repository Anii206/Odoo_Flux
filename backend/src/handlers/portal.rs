use axum::{
    extract::{Path, State},
    Json,
};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use uuid::Uuid;

use crate::{
    auth::AuthenticatedUser,
    error::AppError,
    handlers::subscriptions::list::SubscriptionWithLines,
    models::{Product, ProductVariant, Subscription, SubscriptionLine},
};

#[derive(Debug, Deserialize)]
pub struct ToggleAddonRequest {
    pub addon_product_id: Uuid,
    pub variant_id: Option<Uuid>,
}

#[derive(Debug, Serialize)]
pub struct ToggleAddonResponse {
    pub action: String, // "added" or "removed"
    pub subscription: SubscriptionWithLines,
}

pub async fn get_portal_subscriptions(
    auth: AuthenticatedUser,
    State(pool): State<PgPool>,
) -> Result<Json<Vec<SubscriptionWithLines>>, AppError> {
    let subscriptions = sqlx::query_as::<_, Subscription>(
        "SELECT id, sub_number, customer_id, plan_id, status, start_date, expiry_date, next_billing_date, payment_terms_days, applied_discount_id, created_at FROM subscriptions WHERE customer_id = $1 ORDER BY created_at DESC",
    )
    .bind(auth.id)
    .fetch_all(&pool)
    .await?;

    let lines = sqlx::query_as::<_, SubscriptionLine>(
        "SELECT id, subscription_id, product_id, variant_id, quantity, unit_price, tax_rate, line_total, created_at FROM subscription_lines",
    )
    .fetch_all(&pool)
    .await?;

    let result = subscriptions
        .into_iter()
        .map(|s| {
            let s_lines = lines.iter().filter(|l| l.subscription_id == s.id).cloned().collect();
            SubscriptionWithLines { subscription: s, lines: s_lines }
        })
        .collect();

    Ok(Json(result))
}

pub async fn toggle_addon(
    auth: AuthenticatedUser,
    Path(id): Path<Uuid>,
    State(pool): State<PgPool>,
    Json(payload): Json<ToggleAddonRequest>,
) -> Result<Json<ToggleAddonResponse>, AppError> {
    let sub = sqlx::query_as::<_, Subscription>(
        "SELECT id, sub_number, customer_id, plan_id, status, start_date, expiry_date, next_billing_date, payment_terms_days, applied_discount_id, created_at FROM subscriptions WHERE id = $1",
    )
    .bind(id)
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::NotFound(format!("Subscription {} not found", id)))?;

    if auth.role == "customer" && sub.customer_id != auth.id {
        return Err(AppError::Forbidden("Access denied to this subscription.".into()));
    }
    if sub.status != "active" {
        return Err(AppError::BadRequest("Add-ons can only be modified on active subscriptions.".into()));
    }

    let prod = sqlx::query_as::<_, Product>(
        "SELECT id, name, product_type, sales_price, cost_price, notes, created_at FROM products WHERE id = $1",
    )
    .bind(payload.addon_product_id)
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::NotFound(format!("Product {} not found", payload.addon_product_id)))?;

    if prod.product_type != "addon" {
        return Err(AppError::BadRequest("Only products of type 'addon' can be toggled via this endpoint.".into()));
    }

    let existing_line = sqlx::query_as::<_, SubscriptionLine>(
        "SELECT id, subscription_id, product_id, variant_id, quantity, unit_price, tax_rate, line_total, created_at FROM subscription_lines WHERE subscription_id = $1 AND product_id = $2",
    )
    .bind(id)
    .bind(payload.addon_product_id)
    .fetch_optional(&pool)
    .await?;

    let mut tx = pool.begin().await?;
    let action = if let Some(line) = existing_line {
        sqlx::query("DELETE FROM subscription_lines WHERE id = $1")
            .bind(line.id)
            .execute(&mut *tx)
            .await?;
        "removed".to_string()
    } else {
        let extra = match payload.variant_id {
            Some(v_id) => sqlx::query_as::<_, ProductVariant>(
                "SELECT id, product_id, attribute_name, attribute_value, price_extra, created_at FROM product_variants WHERE id = $1",
            )
            .bind(v_id)
            .fetch_optional(&mut *tx)
            .await?
            .map(|v| v.price_extra)
            .unwrap_or(Decimal::ZERO),
            None => Decimal::ZERO,
        };
        let unit_price = prod.sales_price + extra;
        sqlx::query(
            r#"
            INSERT INTO subscription_lines (subscription_id, product_id, variant_id, quantity, unit_price, tax_rate, line_total)
            VALUES ($1, $2, $3, 1, $4, 0.00, $4)
            "#,
        )
        .bind(id)
        .bind(payload.addon_product_id)
        .bind(payload.variant_id)
        .bind(unit_price)
        .execute(&mut *tx)
        .await?;
        "added".to_string()
    };
    tx.commit().await?;

    let lines = sqlx::query_as::<_, SubscriptionLine>(
        "SELECT id, subscription_id, product_id, variant_id, quantity, unit_price, tax_rate, line_total, created_at FROM subscription_lines WHERE subscription_id = $1",
    )
    .bind(id)
    .fetch_all(&pool)
    .await?;

    Ok(Json(ToggleAddonResponse {
        action,
        subscription: SubscriptionWithLines {
            subscription: sub,
            lines,
        },
    }))
}
