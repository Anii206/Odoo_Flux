use axum::{
    routing::{get, patch, post},
    Router,
};
use sqlx::PgPool;

use crate::{auth, billing, handlers};

pub fn create_router(pool: PgPool) -> Router {
    Router::new()
        // System health
        .route("/api/health", get(handlers::health_check))
        
        // Auth endpoints
        .route("/api/auth/signup", post(auth::signup))
        .route("/api/auth/login", post(auth::login))
        .route("/api/auth/forgot-password", post(auth::forgot_password))
        .route("/api/auth/reset-password", post(auth::reset_password))
        .route("/api/auth/me", get(auth::me))
        
        // Local Outbox & Staff
        .route("/api/dev/emails", get(auth::get_dev_emails))
        .route("/api/admin/staff", post(auth::create_staff))
        .route("/api/admin/users", get(handlers::list_users))
        
        // Products & Variants
        .route("/api/products", get(handlers::list_products).post(handlers::create_product))
        .route("/api/products/{id}", get(handlers::get_product).put(handlers::update_product).delete(handlers::delete_product))
        .route("/api/products/{id}/variants", get(handlers::list_variants).post(handlers::create_variant))
        .route("/api/products/{id}/variants/{variant_id}", get(handlers::get_variant).put(handlers::update_variant).delete(handlers::delete_variant))
        
        // Plans
        .route("/api/plans", get(handlers::list_plans).post(handlers::create_plan))
        .route("/api/plans/{id}", get(handlers::get_plan).put(handlers::update_plan).delete(handlers::delete_plan))
        
        // Taxes & Discounts
        .route("/api/tax-rules", get(handlers::list_tax_rules).post(handlers::create_tax_rule))
        .route("/api/tax-rules/{id}", get(handlers::get_tax_rule).put(handlers::update_tax_rule).delete(handlers::delete_tax_rule))
        .route("/api/taxes", get(handlers::list_tax_rules).post(handlers::create_tax_rule))
        .route("/api/taxes/{id}", get(handlers::get_tax_rule).put(handlers::update_tax_rule).delete(handlers::delete_tax_rule))
        .route("/api/discount-rules", get(handlers::list_discount_rules).post(handlers::create_discount_rule))
        .route("/api/discount-rules/{id}", get(handlers::get_discount_rule).put(handlers::update_discount_rule).delete(handlers::delete_discount_rule))
        .route("/api/discounts", get(handlers::list_discount_rules).post(handlers::create_discount_rule))
        .route("/api/discounts/{id}", get(handlers::get_discount_rule).put(handlers::update_discount_rule).delete(handlers::delete_discount_rule))
        
        // Quotation Templates
        .route("/api/quotation-templates", get(handlers::list_quotation_templates).post(handlers::create_quotation_template))
        .route("/api/quotation-templates/{id}", get(handlers::get_quotation_template).put(handlers::update_quotation_template).delete(handlers::delete_quotation_template))
        
        // Subscriptions & Lifecycle
        .route("/api/subscriptions", get(handlers::list_subscriptions).post(handlers::create_subscription))
        .route("/api/subscriptions/{id}", get(handlers::get_subscription))
        .route("/api/subscriptions/from-template", post(handlers::create_from_template))
        .route("/api/subscriptions/{id}/status", patch(handlers::update_status))
        .route("/api/subscriptions/{id}/discount", patch(handlers::attach_discount))
        .route("/api/subscriptions/{id}/renew", post(handlers::renew_subscription))
        
        // Customer Portal
        .route("/api/portal/subscriptions", get(handlers::get_portal_subscriptions))
        .route("/api/portal/subscriptions/{id}/toggle-addon", post(handlers::toggle_addon))
        
        // Step 3: In-Process Recurring Billing Engine
        .route("/api/billing/run", post(billing::trigger_billing_run))
        
        // Step 3: Invoice Management & Printable HTML
        .route("/api/invoices", get(handlers::list_invoices).post(handlers::create_invoice))
        .route("/api/invoices/{id}", get(handlers::get_invoice))
        .route("/api/invoices/{id}/status", patch(handlers::update_invoice_status))
        .route("/api/invoices/{id}/print", get(handlers::print_invoice))
        .route("/api/invoices/{id}/remind", post(handlers::send_invoice_reminder))
        
        // Step 3: Payments & Overdue Tracking
        .route("/api/invoices/{id}/payments", get(handlers::list_payments).post(handlers::record_payment))
        
        // Step 3: Finance Analytics Dashboard & Bulk Seeder
        .route("/api/finance/dashboard", get(handlers::get_finance_dashboard))
        .route("/api/dev/seed", post(handlers::bulk_seed))
        
        .with_state(pool)
}
