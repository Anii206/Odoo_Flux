use chrono::NaiveDate;
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::models::Invoice;

#[derive(Debug, Deserialize)]
pub struct DashboardQuery {
    pub page: Option<i64>,
    pub page_size: Option<i64>,
    pub status: Option<String>,
    pub customer_id: Option<Uuid>,
    pub from_date: Option<NaiveDate>,
    pub to_date: Option<NaiveDate>,
}

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct FinanceMetrics {
    pub active_subscriptions_count: i64,
    pub mrr: Decimal,
    pub arr: Decimal,
    pub collected_revenue: Decimal,
    pub outstanding_revenue: Decimal,
    pub overdue_invoices_count: i64,
}

#[derive(Debug, Serialize)]
pub struct FinanceDashboardResponse {
    pub metrics: FinanceMetrics,
    pub overdue_invoices: Vec<Invoice>,
    pub page: i64,
    pub page_size: i64,
    pub total_overdue_pages: i64,
}
