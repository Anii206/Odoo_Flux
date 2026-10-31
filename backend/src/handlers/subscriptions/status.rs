use axum::{
    extract::{Path, State},
    Json,
};
use serde::Deserialize;
use sqlx::PgPool;
use uuid::Uuid;

use crate::{
    auth::{AuthenticatedUser, RequireStaffOrAdmin},
    billing::types::compute_anchored_billing_date,
    error::AppError,
    handlers::subscriptions::list::SubscriptionWithLines,
    models::{Plan, Subscription, SubscriptionLine},
};

#[derive(Debug, Deserialize)]
pub struct UpdateStatusRequest {
    pub status: String,
}



pub async fn update_status(
    auth: AuthenticatedUser,
    Path(id): Path<Uuid>,
    State(pool): State<PgPool>,
    Json(payload): Json<UpdateStatusRequest>,
) -> Result<Json<SubscriptionWithLines>, AppError> {
    let sub = sqlx::query_as::<_, Subscription>(
        "SELECT id, sub_number, customer_id, plan_id, status, start_date, expiry_date, next_billing_date, payment_terms_days, applied_discount_id, created_at FROM subscriptions WHERE id = $1",
    ).bind(id).fetch_optional(&pool).await?
    .ok_or_else(|| AppError::NotFound(format!("Subscription {} not found", id)))?;

    if auth.role == "customer" && sub.customer_id != auth.id {
        return Err(AppError::Forbidden("Access denied: You can only manage your own subscriptions.".into()));
    }

    let plan = sqlx::query_as::<_, Plan>(
        "SELECT id, name, billing_interval, plan_price, min_quantity, available_from, available_to, auto_close, allow_early_close, allow_pause, allow_renew, created_at FROM plans WHERE id = $1",
    ).bind(sub.plan_id).fetch_one(&pool).await?;

    let from = sub.status.as_str();
    let to = payload.status.trim();
    let valid = match (from, to) {
        ("draft", "quotation") | ("draft", "closed") => true,
        ("quotation", "confirmed") | ("quotation", "closed") => true,
        ("confirmed", "active") | ("confirmed", "closed") => true,
        ("active", "paused") | ("active", "closed") => true,
        ("paused", "active") | ("paused", "closed") => true,
        _ => false,
    };
    if !valid {
        return Err(AppError::BadRequest(format!("Invalid status transition from '{}' to '{}'.", from, to)));
    }

    if to == "paused" && !plan.allow_pause {
        return Err(AppError::BadRequest("Plan does not permit pausing subscriptions.".into()));
    }
    if to == "closed" {
        let today = chrono::Utc::now().date_naive();
        if let Some(exp) = sub.expiry_date {
            if today < exp && !plan.allow_early_close {
                return Err(AppError::BadRequest("Plan does not permit early closure of subscriptions.".into()));
            }
        }
    }

    let updated = sqlx::query_as::<_, Subscription>(
        r#"
        UPDATE subscriptions SET status = $1 WHERE id = $2
        RETURNING id, sub_number, customer_id, plan_id, status, start_date, expiry_date, next_billing_date, payment_terms_days, applied_discount_id, created_at
        "#,
    ).bind(to).bind(id).fetch_one(&pool).await?;

    let lines = sqlx::query_as::<_, SubscriptionLine>(
        "SELECT id, subscription_id, product_id, variant_id, quantity, unit_price, tax_rate, line_total, created_at FROM subscription_lines WHERE subscription_id = $1",
    ).bind(id).fetch_all(&pool).await?;

    Ok(Json(SubscriptionWithLines { subscription: updated, lines }))
}

#[derive(Debug, Deserialize)]
pub struct AttachDiscountRequest {
    pub discount_id: Option<Uuid>,
}

pub async fn attach_discount(
    _staff: RequireStaffOrAdmin,
    Path(id): Path<Uuid>,
    State(pool): State<PgPool>,
    Json(payload): Json<AttachDiscountRequest>,
) -> Result<Json<SubscriptionWithLines>, AppError> {
    let updated = sqlx::query_as::<_, Subscription>(
        r#"
        UPDATE subscriptions
        SET applied_discount_id = $1
        WHERE id = $2
        RETURNING id, sub_number, customer_id, plan_id, status, start_date, expiry_date, next_billing_date, payment_terms_days, applied_discount_id, created_at
        "#,
    )
    .bind(payload.discount_id)
    .bind(id)
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::NotFound(format!("Subscription {} not found", id)))?;

    let lines = sqlx::query_as::<_, SubscriptionLine>(
        "SELECT id, subscription_id, product_id, variant_id, quantity, unit_price, tax_rate, line_total, created_at FROM subscription_lines WHERE subscription_id = $1",
    ).bind(id).fetch_all(&pool).await?;

    Ok(Json(SubscriptionWithLines { subscription: updated, lines }))
}

pub async fn renew_subscription(
    auth: AuthenticatedUser,
    Path(id): Path<Uuid>,
    State(pool): State<PgPool>,
) -> Result<Json<SubscriptionWithLines>, AppError> {
    let sub = sqlx::query_as::<_, Subscription>(
        "SELECT id, sub_number, customer_id, plan_id, status, start_date, expiry_date, next_billing_date, payment_terms_days, applied_discount_id, created_at FROM subscriptions WHERE id = $1",
    ).bind(id).fetch_optional(&pool).await?
    .ok_or_else(|| AppError::NotFound(format!("Subscription {} not found", id)))?;

    if auth.role == "customer" && sub.customer_id != auth.id {
        return Err(AppError::Forbidden("Access denied.".into()));
    }

    let plan = sqlx::query_as::<_, Plan>(
        "SELECT id, name, billing_interval, plan_price, min_quantity, available_from, available_to, auto_close, allow_early_close, allow_pause, allow_renew, created_at FROM plans WHERE id = $1",
    ).bind(sub.plan_id).fetch_one(&pool).await?;

    if !plan.allow_renew {
        return Err(AppError::BadRequest("Plan does not permit renewals.".into()));
    }

    let today = chrono::Utc::now().date_naive();
    let base_exp = sub.expiry_date.unwrap_or(today);
    let new_exp = compute_anchored_billing_date(
        sub.start_date,
        if base_exp < today { today } else { base_exp },
        &plan.billing_interval,
    );
    let new_next_billing = compute_anchored_billing_date(
        sub.start_date,
        sub.next_billing_date,
        &plan.billing_interval,
    );

    let updated = sqlx::query_as::<_, Subscription>(
        r#"
        UPDATE subscriptions
        SET expiry_date = $1, next_billing_date = $2, status = 'active'
        WHERE id = $3
        RETURNING id, sub_number, customer_id, plan_id, status, start_date, expiry_date, next_billing_date, payment_terms_days, applied_discount_id, created_at
        "#,
    ).bind(new_exp).bind(new_next_billing).bind(id).fetch_one(&pool).await?;

    let lines = sqlx::query_as::<_, SubscriptionLine>(
        "SELECT id, subscription_id, product_id, variant_id, quantity, unit_price, tax_rate, line_total, created_at FROM subscription_lines WHERE subscription_id = $1",
    ).bind(id).fetch_all(&pool).await?;

    Ok(Json(SubscriptionWithLines { subscription: updated, lines }))
}
