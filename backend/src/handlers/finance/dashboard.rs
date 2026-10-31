use axum::{
    extract::{Query, State},
    Json,
};
use sqlx::PgPool;

use crate::{
    auth::RequireStaffOrAdmin,
    error::AppError,
    handlers::finance::types::{DashboardQuery, FinanceDashboardResponse, FinanceMetrics},
    models::Invoice,
};

pub async fn get_finance_dashboard(
    _staff: RequireStaffOrAdmin,
    Query(params): Query<DashboardQuery>,
    State(pool): State<PgPool>,
) -> Result<Json<FinanceDashboardResponse>, AppError> {
    let metrics = sqlx::query_as::<_, FinanceMetrics>(
        r#"
        WITH sub_lines_agg AS (
            SELECT 
                s.id AS subscription_id,
                p.billing_interval,
                COALESCE(SUM(sl.line_total), p.plan_price) AS period_amount
            FROM subscriptions s
            JOIN plans p ON p.id = s.plan_id
            LEFT JOIN subscription_lines sl ON sl.subscription_id = s.id
            WHERE s.status = 'active'
            GROUP BY s.id, p.billing_interval, p.plan_price
        ),
        sub_mrr AS (
            SELECT 
                COUNT(*) AS active_subs_count,
                COALESCE(SUM(
                    CASE 
                        WHEN billing_interval = 'daily' THEN period_amount * 30
                        WHEN billing_interval = 'weekly' THEN period_amount * 4.3333333333
                        WHEN billing_interval = 'monthly' THEN period_amount * 1
                        WHEN billing_interval = 'yearly' THEN period_amount / 12
                        ELSE period_amount
                    END
                ), 0.00) AS mrr
            FROM sub_lines_agg
        ),
        inv_agg AS (
            SELECT 
                COALESCE(SUM(amount_paid), 0.00) AS collected_revenue,
                COALESCE(SUM(
                    CASE 
                        WHEN status = 'confirmed' AND amount_paid < grand_total 
                        THEN (grand_total - amount_paid) 
                        ELSE 0.00 
                    END
                ), 0.00) AS outstanding_revenue,
                COUNT(*) FILTER (
                    WHERE status IN ('confirmed', 'draft') 
                      AND due_date < CURRENT_DATE 
                      AND amount_paid < grand_total
                ) AS overdue_invoices_count
            FROM invoices
        )
        SELECT 
            sub_mrr.active_subs_count AS active_subscriptions_count,
            ROUND(sub_mrr.mrr, 2) AS mrr,
            ROUND(sub_mrr.mrr * 12, 2) AS arr,
            inv_agg.collected_revenue,
            inv_agg.outstanding_revenue,
            inv_agg.overdue_invoices_count
        FROM sub_mrr, inv_agg;
        "#,
    )
    .fetch_one(&pool)
    .await?;

    let page = params.page.unwrap_or(1).max(1);
    let page_size = params.page_size.unwrap_or(20).clamp(1, 100);
    let offset = (page - 1) * page_size;

    let overdue_invoices = sqlx::query_as::<_, Invoice>(
        r#"
        SELECT id, invoice_number, subscription_id, customer_id, billing_period_start, billing_period_end, status, subtotal, discount_amount, tax_amount, grand_total, amount_paid, due_date, created_at
        FROM invoices
        WHERE due_date < CURRENT_DATE AND amount_paid < grand_total
          AND ($1::varchar IS NULL OR status = $1)
          AND ($2::uuid IS NULL OR customer_id = $2)
          AND ($3::date IS NULL OR due_date >= $3)
          AND ($4::date IS NULL OR due_date <= $4)
        ORDER BY due_date ASC
        LIMIT $5 OFFSET $6
        "#,
    )
    .bind(params.status)
    .bind(params.customer_id)
    .bind(params.from_date)
    .bind(params.to_date)
    .bind(page_size)
    .bind(offset)
    .fetch_all(&pool)
    .await?;

    let total_pages = (metrics.overdue_invoices_count as f64 / page_size as f64).ceil() as i64;

    Ok(Json(FinanceDashboardResponse {
        metrics,
        overdue_invoices,
        page,
        page_size,
        total_overdue_pages: total_pages.max(1),
    }))
}
