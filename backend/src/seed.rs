use sqlx::PgPool;
use uuid::Uuid;

use crate::auth;

pub async fn seed_database(pool: &PgPool) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let app_env = std::env::var("APP_ENV").unwrap_or_else(|_| "production".to_string());
    if app_env.to_lowercase() != "development" {
        tracing::info!("APP_ENV is '{}': demo user and test seeding disabled in non-dev database.", app_env);
        return Ok(());
    }

    // 1. Seed initial demo users for fast 1-click role switcher in development
    let default_users = [
        ("admin@brightloop.io", "Admin@Brightloop2026!", "admin"),
        ("staff@brightloop.io", "Staff@Brightloop2026!", "staff"),
        ("finance@brightloop.io", "Finance@Brightloop2026!", "staff"),
        ("customer@brightloop.io", "Customer@Brightloop2026!", "customer"),
    ];

    for (email, pass, role) in default_users {
        let exists = sqlx::query_scalar::<_, i64>("SELECT COUNT(*) FROM users WHERE email = $1")
            .bind(email)
            .fetch_one(pool)
            .await?;
        if exists == 0 {
            let hashed_pass = auth::hash_password(pass)?;
            sqlx::query(
                "INSERT INTO users (id, email, password_hash, role) VALUES ($1, $2, $3, $4)",
            )
            .bind(Uuid::new_v4())
            .bind(email)
            .bind(hashed_pass)
            .bind(role)
            .execute(pool)
            .await?;
            tracing::info!("Seeded default demo user: email='{}', role='{}'", email, role);
        }
    }

    // 2. Seed initial demo products if empty
    let product_count = sqlx::query_scalar::<_, i64>("SELECT COUNT(*) FROM products")
        .fetch_one(pool)
        .await?;

    if product_count == 0 {
        // Product 1: Enterprise ERP Software
        let p1_id = Uuid::new_v4();
        sqlx::query(
            r#"
            INSERT INTO products (id, name, product_type, sales_price, cost_price, notes)
            VALUES ($1, 'BrightCloud Core Suite', 'software', 1200.00, 300.00, 'Core SaaS enterprise platform')
            "#,
        )
        .bind(p1_id)
        .execute(pool)
        .await?;

        // Variants for Product 1
        sqlx::query(
            r#"
            INSERT INTO product_variants (product_id, attribute_name, attribute_value, price_extra)
            VALUES 
                ($1, 'Brand', 'Odoo Enterprise Integration', 560.00),
                ($1, 'Brand', 'Standard Standalone', 0.00)
            "#,
        )
        .bind(p1_id)
        .execute(pool)
        .await?;

        // Product 2: Addon module
        let p2_id = Uuid::new_v4();
        sqlx::query(
            r#"
            INSERT INTO products (id, name, product_type, sales_price, cost_price, notes)
            VALUES ($1, 'Advanced Subscription Analytics Addon', 'addon', 250.00, 50.00, 'Predictive churn & revenue reporting')
            "#,
        )
        .bind(p2_id)
        .execute(pool)
        .await?;

        // Product 3: Service
        let p3_id = Uuid::new_v4();
        sqlx::query(
            r#"
            INSERT INTO products (id, name, product_type, sales_price, cost_price, notes)
            VALUES ($1, 'Onboarding & Migration Service', 'service', 950.00, 400.00, 'Dedicated deployment specialist support')
            "#,
        )
        .bind(p3_id)
        .execute(pool)
        .await?;

        // 3. Seed Plans
        let plan_monthly_id = Uuid::new_v4();
        sqlx::query(
            r#"
            INSERT INTO plans (
                id, name, billing_interval, plan_price, min_quantity,
                available_from, auto_close, allow_early_close, allow_pause, allow_renew
            )
            VALUES ($1, 'Enterprise Monthly Plan', 'monthly', 199.00, 1, CURRENT_DATE, false, true, true, true)
            "#,
        )
        .bind(plan_monthly_id)
        .execute(pool)
        .await?;

        let plan_yearly_id = Uuid::new_v4();
        sqlx::query(
            r#"
            INSERT INTO plans (
                id, name, billing_interval, plan_price, min_quantity,
                available_from, auto_close, allow_early_close, allow_pause, allow_renew
            )
            VALUES ($1, 'Enterprise Annual Plan (20% Off)', 'yearly', 1990.00, 1, CURRENT_DATE, false, true, true, true)
            "#,
        )
        .bind(plan_yearly_id)
        .execute(pool)
        .await?;

        // 4. Seed Tax Rules
        sqlx::query(
            r#"
            INSERT INTO tax_rules (name, rate_percentage, is_active)
            VALUES 
                ('Standard VAT / GST', 18.00, true),
                ('Zero Rate / Export', 0.00, true)
            "#,
        )
        .execute(pool)
        .await?;

        // 5. Seed Discount Rules
        sqlx::query(
            r#"
            INSERT INTO discount_rules (
                name, discount_type, value, min_purchase_amount, min_quantity,
                start_date, applies_to, target_product_id
            )
            VALUES 
                ('Early Adopter 15%', 'percentage', 15.00, 100.00, 1, CURRENT_DATE, 'all', NULL),
                ('Software Launch Flat Discount', 'fixed', 100.00, 500.00, 1, CURRENT_DATE, 'product', $1)
            "#,
        )
        .bind(p1_id)
        .execute(pool)
        .await?;

        // 6. Seed Quotation Template
        let template_id = Uuid::new_v4();
        sqlx::query(
            r#"
            INSERT INTO quotation_templates (id, name, plan_id, validity_days)
            VALUES ($1, 'Standard SaaS Onboarding Package', $2, 30)
            "#,
        )
        .bind(template_id)
        .bind(plan_monthly_id)
        .execute(pool)
        .await?;

        sqlx::query(
            r#"
            INSERT INTO quotation_template_lines (template_id, product_id, quantity)
            VALUES ($1, $2, 1), ($1, $3, 1)
            "#,
        )
        .bind(template_id)
        .bind(p1_id)
        .bind(p2_id)
        .execute(pool)
        .await?;

        tracing::info!("Seeded default products, plans, tax rules, and quotation templates.");
    }

    Ok(())
}
