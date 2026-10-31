use chrono::NaiveDate;
use rust_decimal::Decimal;
use sqlx::PgPool;
use uuid::Uuid;

use crate::{
    billing::types::{compute_anchored_billing_date, BillingRunResult},
    error::AppError,
    models::{DiscountRule, Plan, Subscription, SubscriptionLine},
};

pub async fn run_billing_cycle(pool: &PgPool, target_date: NaiveDate) -> Result<BillingRunResult, AppError> {
    let mut tx = pool.begin().await?;

    let subs = sqlx::query_as::<_, Subscription>(
        r#"
        SELECT id, sub_number, customer_id, plan_id, status, start_date, expiry_date, next_billing_date, payment_terms_days, applied_discount_id, created_at
        FROM subscriptions
        WHERE status = 'active' AND next_billing_date <= $1
        FOR UPDATE SKIP LOCKED
        "#,
    )
    .bind(target_date)
    .fetch_all(&mut *tx)
    .await?;

    let active_tax_rate: Decimal = sqlx::query_scalar(
        "SELECT COALESCE(SUM(rate_percentage), 0.00) FROM tax_rules WHERE is_active = TRUE",
    )
    .fetch_one(&mut *tx)
    .await?;

    let mut invoices_gen = 0;
    let mut subs_closed = 0;

    for sub in &subs {
        let plan = sqlx::query_as::<_, Plan>(
            "SELECT id, name, billing_interval, plan_price, min_quantity, available_from, available_to, auto_close, allow_early_close, allow_pause, allow_renew, created_at FROM plans WHERE id = $1",
        )
        .bind(sub.plan_id)
        .fetch_one(&mut *tx)
        .await?;

        if plan.auto_close && sub.expiry_date.map_or(false, |exp| exp <= target_date) {
            sqlx::query("UPDATE subscriptions SET status = 'closed' WHERE id = $1")
                .bind(sub.id)
                .execute(&mut *tx)
                .await?;
            subs_closed += 1;
            continue;
        }

        let lines = sqlx::query_as::<_, SubscriptionLine>(
            "SELECT id, subscription_id, product_id, variant_id, quantity, unit_price, tax_rate, line_total, created_at FROM subscription_lines WHERE subscription_id = $1",
        )
        .bind(sub.id)
        .fetch_all(&mut *tx)
        .await?;

        if lines.is_empty() {
            continue;
        }

        let subtotal: Decimal = lines.iter().map(|l| l.line_total).sum();
        let total_qty: i32 = lines.iter().map(|l| l.quantity).sum();
        let mut discount_amt = Decimal::ZERO;

        let maybe_rule = if let Some(disc_id) = sub.applied_discount_id {
            sqlx::query_as::<_, DiscountRule>(
                "SELECT id, name, discount_type, value, min_purchase_amount, min_quantity, start_date, end_date, max_uses, current_uses, applies_to, target_product_id, created_at FROM discount_rules WHERE id = $1",
            )
            .bind(disc_id)
            .fetch_optional(&mut *tx)
            .await?
        } else {
            let matched_rule = sqlx::query_as::<_, DiscountRule>(
                r#"
                SELECT id, name, discount_type, value, min_purchase_amount, min_quantity, start_date, end_date, max_uses, current_uses, applies_to, target_product_id, created_at
                FROM discount_rules
                WHERE start_date <= $1 AND (end_date IS NULL OR end_date >= $1)
                  AND (max_uses IS NULL OR current_uses < max_uses)
                  AND min_purchase_amount <= $2
                  AND min_quantity <= $3
                ORDER BY value DESC
                LIMIT 1
                "#,
            )
            .bind(target_date)
            .bind(subtotal)
            .bind(total_qty)
            .fetch_optional(&mut *tx)
            .await?;

            if let Some(ref r) = matched_rule {
                sqlx::query("UPDATE subscriptions SET applied_discount_id = $1 WHERE id = $2")
                    .bind(r.id)
                    .bind(sub.id)
                    .execute(&mut *tx)
                    .await?;
            }
            matched_rule
        };

        let mut qualifying_rule_id: Option<Uuid> = None;

        if let Some(rule) = maybe_rule {
            let valid_date = target_date >= rule.start_date && rule.end_date.map_or(true, |ed| target_date <= ed);
            let valid_uses = rule.max_uses.map_or(true, |mu| rule.current_uses < mu);
            let valid_min = subtotal >= rule.min_purchase_amount && total_qty >= rule.min_quantity;

            if valid_date && valid_uses && valid_min {
                if rule.applies_to == "all" {
                    discount_amt = if rule.discount_type == "percentage" {
                        (subtotal * (rule.value / Decimal::from(100))).round_dp(2)
                    } else {
                        rule.value.min(subtotal)
                    };
                    qualifying_rule_id = Some(rule.id);
                } else if let Some(target_p) = rule.target_product_id {
                    if let Some(tl) = lines.iter().find(|l| l.product_id == target_p) {
                        discount_amt = if rule.discount_type == "percentage" {
                            (tl.line_total * (rule.value / Decimal::from(100))).round_dp(2)
                        } else {
                            rule.value.min(tl.line_total)
                        };
                        qualifying_rule_id = Some(rule.id);
                    }
                }
            }
        }

        let taxable_base = (subtotal - discount_amt).max(Decimal::ZERO);
        let tax_amt = (taxable_base * (active_tax_rate / Decimal::from(100))).round_dp(2);
        let grand_total = taxable_base + tax_amt;

        let period_start = sub.next_billing_date;
        let period_end = compute_anchored_billing_date(sub.start_date, period_start, &plan.billing_interval);
        let due_date = period_start + chrono::Duration::days(sub.payment_terms_days as i64);

        let seq_val: i64 = sqlx::query_scalar("SELECT nextval('invoice_num_seq')")
            .fetch_one(&mut *tx)
            .await
            .unwrap_or(chrono::Utc::now().timestamp_micros() % 1000000);
        let invoice_num = format!("INV-{}-{:06}", target_date.format("%Y"), seq_val);

        let maybe_inv_id: Option<Uuid> = sqlx::query_scalar(
            r#"
            INSERT INTO invoices (
                invoice_number, subscription_id, customer_id, billing_period_start, billing_period_end,
                status, subtotal, discount_amount, tax_amount, grand_total, amount_paid, due_date
            )
            VALUES ($1, $2, $3, $4, $5, 'draft', $6, $7, $8, $9, 0.00, $10)
            ON CONFLICT (subscription_id, billing_period_start) DO NOTHING
            RETURNING id
            "#,
        )
        .bind(&invoice_num).bind(sub.id).bind(sub.customer_id)
        .bind(period_start).bind(period_end).bind(subtotal).bind(discount_amt)
        .bind(tax_amt).bind(grand_total).bind(due_date)
        .fetch_optional(&mut *tx)
        .await?;

        if let Some(inv_id) = maybe_inv_id {
            // Increment discount rule usage ONLY upon successful non-conflicting invoice generation
            if let Some(rule_id) = qualifying_rule_id {
                let _ = sqlx::query(
                    "UPDATE discount_rules SET current_uses = current_uses + 1 WHERE id = $1 AND (max_uses IS NULL OR current_uses < max_uses)",
                )
                .bind(rule_id)
                .execute(&mut *tx)
                .await?;
            }

            for l in &lines {
                sqlx::query(
                    r#"
                    INSERT INTO invoice_lines (invoice_id, product_id, variant_id, quantity, unit_price, tax_rate, line_total)
                    VALUES ($1, $2, $3, $4, $5, $6, $7)
                    "#,
                )
                .bind(inv_id).bind(l.product_id).bind(l.variant_id).bind(l.quantity)
                .bind(l.unit_price).bind(active_tax_rate).bind(l.line_total)
                .execute(&mut *tx)
                .await?;
            }

            invoices_gen += 1;
        }

        // Always advance next_billing_date to period_end (even when conflict occurred) so sub is not stuck
        sqlx::query("UPDATE subscriptions SET next_billing_date = $1 WHERE id = $2")
            .bind(period_end)
            .bind(sub.id)
            .execute(&mut *tx)
            .await?;
    }

    tx.commit().await?;

    Ok(BillingRunResult {
        target_date,
        subscriptions_scanned: subs.len(),
        invoices_generated: invoices_gen,
        subscriptions_closed: subs_closed,
    })
}
