use axum::{
    extract::{Path, State},
    Json,
};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use uuid::Uuid;

use crate::{
    auth::AuthenticatedUser,
    error::AppError,
    models::{Subscription, SubscriptionLine},
};

#[derive(Debug, Serialize, Deserialize)]
pub struct SubscriptionWithLines {
    pub subscription: Subscription,
    pub lines: Vec<SubscriptionLine>,
}

pub async fn list_subscriptions(
    auth: AuthenticatedUser,
    State(pool): State<PgPool>,
) -> Result<Json<Vec<SubscriptionWithLines>>, AppError> {
    let subscriptions = if auth.role == "customer" {
        sqlx::query_as::<_, Subscription>(
            "SELECT id, sub_number, customer_id, plan_id, status, start_date, expiry_date, next_billing_date, payment_terms_days, applied_discount_id, created_at FROM subscriptions WHERE customer_id = $1 ORDER BY created_at DESC LIMIT 200",
        )
        .bind(auth.id)
        .fetch_all(&pool)
        .await?
    } else {
        sqlx::query_as::<_, Subscription>(
            "SELECT id, sub_number, customer_id, plan_id, status, start_date, expiry_date, next_billing_date, payment_terms_days, applied_discount_id, created_at FROM subscriptions ORDER BY created_at DESC LIMIT 200",
        )
        .fetch_all(&pool)
        .await?
    };

    let sub_ids: Vec<Uuid> = subscriptions.iter().map(|s| s.id).collect();
    let lines = if sub_ids.is_empty() {
        Vec::new()
    } else {
        sqlx::query_as::<_, SubscriptionLine>(
            "SELECT id, subscription_id, product_id, variant_id, quantity, unit_price, tax_rate, line_total, created_at FROM subscription_lines WHERE subscription_id = ANY($1)",
        )
        .bind(&sub_ids)
        .fetch_all(&pool)
        .await?
    };

    use std::collections::HashMap;
    let mut lines_map: HashMap<Uuid, Vec<SubscriptionLine>> = HashMap::new();
    for line in lines {
        lines_map.entry(line.subscription_id).or_default().push(line);
    }

    let result = subscriptions
        .into_iter()
        .map(|s| {
            let s_lines = lines_map.remove(&s.id).unwrap_or_default();
            SubscriptionWithLines { subscription: s, lines: s_lines }
        })
        .collect();

    Ok(Json(result))
}

pub async fn get_subscription(
    auth: AuthenticatedUser,
    Path(id): Path<Uuid>,
    State(pool): State<PgPool>,
) -> Result<Json<SubscriptionWithLines>, AppError> {
    let subscription = sqlx::query_as::<_, Subscription>(
        "SELECT id, sub_number, customer_id, plan_id, status, start_date, expiry_date, next_billing_date, payment_terms_days, applied_discount_id, created_at FROM subscriptions WHERE id = $1",
    )
    .bind(id)
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::NotFound(format!("Subscription {} not found", id)))?;

    if auth.role == "customer" && subscription.customer_id != auth.id {
        return Err(AppError::Forbidden("Access denied to this subscription.".into()));
    }

    let lines = sqlx::query_as::<_, SubscriptionLine>(
        "SELECT id, subscription_id, product_id, variant_id, quantity, unit_price, tax_rate, line_total, created_at FROM subscription_lines WHERE subscription_id = $1",
    )
    .bind(id)
    .fetch_all(&pool)
    .await?;

    Ok(Json(SubscriptionWithLines { subscription, lines }))
}
