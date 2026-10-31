use axum::{extract::State, Json};
use rust_decimal::Decimal;
use serde::Deserialize;
use sqlx::PgPool;
use uuid::Uuid;

use crate::{
    auth::{AuthenticatedUser, RequireStaffOrAdmin},
    error::AppError,
    handlers::subscriptions::list::SubscriptionWithLines,
    models::{Plan, Product, ProductVariant, QuotationTemplate, QuotationTemplateLine, Subscription, SubscriptionLine},
};

#[derive(Debug, Deserialize)]
pub struct CreateSubscriptionLineInput {
    pub product_id: Uuid,
    pub variant_id: Option<Uuid>,
    pub quantity: i32,
    pub unit_price: Decimal,
    pub tax_rate: Option<Decimal>,
}

#[derive(Debug, Deserialize)]
pub struct CreateSubscriptionInput {
    pub customer_id: Uuid,
    pub plan_id: Uuid,
    pub start_date: Option<chrono::NaiveDate>,
    pub expiry_date: Option<chrono::NaiveDate>,
    pub next_billing_date: Option<chrono::NaiveDate>,
    pub payment_terms_days: Option<i32>,
    pub applied_discount_id: Option<Uuid>,
    pub lines: Vec<CreateSubscriptionLineInput>,
}

#[derive(Debug, Deserialize)]
pub struct FromTemplateInput {
    pub template_id: Uuid,
    pub customer_id: Uuid,
}

pub async fn create_subscription(
    auth: AuthenticatedUser,
    State(pool): State<PgPool>,
    Json(payload): Json<CreateSubscriptionInput>,
) -> Result<Json<SubscriptionWithLines>, AppError> {
    if auth.role == "customer" && auth.id != payload.customer_id {
        return Err(AppError::Forbidden("Customers can only create their own subscriptions.".into()));
    }
    if payload.lines.is_empty() {
        return Err(AppError::BadRequest("At least one subscription line is required.".into()));
    }

    let mut tx = pool.begin().await?;
    let count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM subscriptions").fetch_one(&mut *tx).await?;
    let sub_number = format!("SUB-{:05}", count + 1);
    let today = chrono::Utc::now().date_naive();
    let start_date = payload.start_date.unwrap_or(today);
    let next_billing = payload.next_billing_date.unwrap_or(start_date);

    let sub = sqlx::query_as::<_, Subscription>(
        r#"
        INSERT INTO subscriptions (
            sub_number, customer_id, plan_id, status, start_date, expiry_date, next_billing_date, payment_terms_days, applied_discount_id
        ) VALUES ($1, $2, $3, 'draft', $4, $5, $6, $7, $8)
        RETURNING id, sub_number, customer_id, plan_id, status, start_date, expiry_date, next_billing_date, payment_terms_days, applied_discount_id, created_at
        "#,
    )
    .bind(&sub_number).bind(payload.customer_id).bind(payload.plan_id)
    .bind(start_date).bind(payload.expiry_date).bind(next_billing)
    .bind(payload.payment_terms_days.unwrap_or(15)).bind(payload.applied_discount_id)
    .fetch_one(&mut *tx).await?;

    let mut lines = Vec::new();
    for l in payload.lines {
        let tax = l.tax_rate.unwrap_or(Decimal::ZERO);
        let total = l.unit_price * Decimal::from(l.quantity);
        let line = sqlx::query_as::<_, SubscriptionLine>(
            r#"
            INSERT INTO subscription_lines (subscription_id, product_id, variant_id, quantity, unit_price, tax_rate, line_total)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id, subscription_id, product_id, variant_id, quantity, unit_price, tax_rate, line_total, created_at
            "#,
        )
        .bind(sub.id).bind(l.product_id).bind(l.variant_id).bind(l.quantity).bind(l.unit_price).bind(tax).bind(total)
        .fetch_one(&mut *tx).await?;
        lines.push(line);
    }
    tx.commit().await?;

    Ok(Json(SubscriptionWithLines { subscription: sub, lines }))
}

pub async fn create_from_template(
    _staff: RequireStaffOrAdmin,
    State(pool): State<PgPool>,
    Json(payload): Json<FromTemplateInput>,
) -> Result<Json<SubscriptionWithLines>, AppError> {
    let tpl = sqlx::query_as::<_, QuotationTemplate>(
        "SELECT id, name, plan_id, validity_days, created_at FROM quotation_templates WHERE id = $1",
    ).bind(payload.template_id).fetch_optional(&pool).await?
    .ok_or_else(|| AppError::NotFound(format!("Template {} not found", payload.template_id)))?;

    let tpl_lines = sqlx::query_as::<_, QuotationTemplateLine>(
        "SELECT id, template_id, product_id, variant_id, quantity, created_at FROM quotation_template_lines WHERE template_id = $1",
    ).bind(tpl.id).fetch_all(&pool).await?;
    if tpl_lines.is_empty() {
        return Err(AppError::BadRequest("Quotation template has no lines.".into()));
    }

    let plan = sqlx::query_as::<_, Plan>(
        "SELECT id, name, billing_interval, plan_price, min_quantity, available_from, available_to, auto_close, allow_early_close, allow_pause, allow_renew, created_at FROM plans WHERE id = $1",
    ).bind(tpl.plan_id).fetch_one(&pool).await?;

    let today = chrono::Utc::now().date_naive();
    if today < plan.available_from || (plan.available_to.is_some() && today > plan.available_to.unwrap()) {
        return Err(AppError::BadRequest("Plan is not currently available for subscriptions.".into()));
    }

    let total_qty: i32 = tpl_lines.iter().map(|l| l.quantity).sum();
    if total_qty < plan.min_quantity {
        return Err(AppError::BadRequest(format!("Minimum quantity required for plan is {}.", plan.min_quantity)));
    }

    let expiry = today + chrono::Duration::days(tpl.validity_days as i64);

    let mut tx = pool.begin().await?;
    let count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM subscriptions").fetch_one(&mut *tx).await?;
    let sub_number = format!("SUB-{:05}", count + 1);

    let sub = sqlx::query_as::<_, Subscription>(
        r#"
        INSERT INTO subscriptions (
            sub_number, customer_id, plan_id, status, start_date, expiry_date, next_billing_date, payment_terms_days
        ) VALUES ($1, $2, $3, 'draft', $4, $5, $6, 15)
        RETURNING id, sub_number, customer_id, plan_id, status, start_date, expiry_date, next_billing_date, payment_terms_days, applied_discount_id, created_at
        "#,
    )
    .bind(&sub_number).bind(payload.customer_id).bind(plan.id).bind(today).bind(expiry).bind(today)
    .fetch_one(&mut *tx).await?;

    let mut lines = Vec::new();
    for l in tpl_lines {
        let prod = sqlx::query_as::<_, Product>("SELECT id, name, product_type, sales_price, cost_price, notes, created_at FROM products WHERE id = $1")
            .bind(l.product_id).fetch_one(&mut *tx).await?;
        let extra = match l.variant_id {
            Some(v_id) => sqlx::query_as::<_, ProductVariant>("SELECT id, product_id, attribute_name, attribute_value, price_extra, created_at FROM product_variants WHERE id = $1")
                .bind(v_id).fetch_optional(&mut *tx).await?.map(|v| v.price_extra).unwrap_or(Decimal::ZERO),
            None => Decimal::ZERO,
        };
        let unit_price = prod.sales_price + extra;
        let line_total = unit_price * Decimal::from(l.quantity);

        let s_line = sqlx::query_as::<_, SubscriptionLine>(
            r#"
            INSERT INTO subscription_lines (subscription_id, product_id, variant_id, quantity, unit_price, tax_rate, line_total)
            VALUES ($1, $2, $3, $4, $5, 0.00, $6)
            RETURNING id, subscription_id, product_id, variant_id, quantity, unit_price, tax_rate, line_total, created_at
            "#,
        )
        .bind(sub.id).bind(l.product_id).bind(l.variant_id).bind(l.quantity).bind(unit_price).bind(line_total)
        .fetch_one(&mut *tx).await?;
        lines.push(s_line);
    }
    tx.commit().await?;

    Ok(Json(SubscriptionWithLines { subscription: sub, lines }))
}
