use axum::{extract::State, Json};
use serde_json::json;
use sqlx::PgPool;
use std::time::Instant;
use uuid::Uuid;

use crate::{auth::RequireAdmin, error::AppError};

pub async fn bulk_seed(
    _admin: RequireAdmin,
    State(pool): State<PgPool>,
) -> Result<Json<serde_json::Value>, AppError> {
    let app_env = std::env::var("APP_ENV").unwrap_or_else(|_| "production".to_string());
    if app_env.to_lowercase() != "development" {
        return Err(AppError::NotFound("Endpoint not found.".to_string()));
    }
    let start = Instant::now();
    let mut tx = pool.begin().await?;

    let cust_id = sqlx::query_scalar::<_, Uuid>(
        r#"INSERT INTO users (email, password_hash, role)
           VALUES ('bulk_customer@brightloop.io', '$argon2id$v=19$m=19456,t=2,p=1$c29tZXNhbHQ$e2IuV9KxXj3h8Jq2', 'customer')
           ON CONFLICT (email) DO UPDATE SET role = 'customer' RETURNING id"#
    ).fetch_one(&mut *tx).await?;

    let prod_id = sqlx::query_scalar::<_, Uuid>(
        r#"INSERT INTO products (name, product_type, sales_price, cost_price, notes)
           VALUES ('Brightloop Enterprise Suite', 'software', 1200.00, 300.00, 'Bulk product') RETURNING id"#
    ).fetch_one(&mut *tx).await?;

    let var_id = sqlx::query_scalar::<_, Uuid>(
        r#"INSERT INTO product_variants (product_id, attribute_name, attribute_value, price_extra)
           VALUES ($1, 'Brand', 'Odoo', 560.00) RETURNING id"#
    ).bind(prod_id).fetch_one(&mut *tx).await?;

    let plan_id = sqlx::query_scalar::<_, Uuid>(
        r#"INSERT INTO plans (name, billing_interval, plan_price, min_quantity, available_from, auto_close, allow_early_close, allow_pause, allow_renew)
           VALUES ('Cloud Scale Annual', 'yearly', 1760.00, 1, CURRENT_DATE - INTERVAL '1 year', FALSE, TRUE, TRUE, TRUE) RETURNING id"#
    ).fetch_one(&mut *tx).await?;

    let sub_offset: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM subscriptions").fetch_one(&mut *tx).await?;
    let inv_offset: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM invoices").fetch_one(&mut *tx).await?;

    sqlx::query(
        r#"
        WITH new_subs AS (
            INSERT INTO subscriptions (id, sub_number, customer_id, plan_id, status, start_date, next_billing_date, payment_terms_days)
            SELECT 
                gen_random_uuid(),
                'SUB-SEED-' || lpad((s + $1)::text, 7, '0'),
                $2,
                $3,
                'active',
                CURRENT_DATE - INTERVAL '1 year',
                CURRENT_DATE + ((s % 30) || ' days')::interval,
                15
            FROM UNNEST(ARRAY(SELECT generate_series(1, 2500))) AS s
            RETURNING id
        ),
        new_lines AS (
            INSERT INTO subscription_lines (subscription_id, product_id, variant_id, quantity, unit_price, tax_rate, line_total)
            SELECT 
                id,
                $4,
                $5,
                1,
                1760.00,
                0.00,
                1760.00
            FROM new_subs
        )
        INSERT INTO invoices (invoice_number, subscription_id, customer_id, billing_period_start, billing_period_end, status, subtotal, discount_amount, tax_amount, grand_total, amount_paid, due_date)
        SELECT 
            'INV-SEED-' || lpad((row_number() over() + $6)::text, 7, '0'),
            id,
            $2,
            CURRENT_DATE - INTERVAL '60 days',
            CURRENT_DATE + INTERVAL '305 days',
            CASE WHEN (row_number() over() % 3 = 0) THEN 'confirmed' ELSE 'paid' END,
            1760.00,
            0.00,
            0.00,
            1760.00,
            CASE WHEN (row_number() over() % 3 = 0) THEN 0.00 ELSE 1760.00 END,
            CASE WHEN (row_number() over() % 3 = 0) THEN CURRENT_DATE - INTERVAL '5 days' ELSE CURRENT_DATE + INTERVAL '15 days' END
        FROM new_subs;
        "#,
    )
    .bind(sub_offset).bind(cust_id).bind(plan_id).bind(prod_id).bind(var_id).bind(inv_offset)
    .execute(&mut *tx).await?;

    tx.commit().await?;
    let elapsed = start.elapsed();

    Ok(Json(json!({
        "success": true,
        "subscriptions_seeded": 2500,
        "elapsed_ms": elapsed.as_millis(),
        "under_1_second": elapsed.as_millis() < 1000
    })))
}
