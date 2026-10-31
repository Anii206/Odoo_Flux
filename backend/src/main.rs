mod auth;
mod billing;
mod error;
mod handlers;
mod models;
mod routes;
mod seed;

use std::net::SocketAddr;
use tower_http::cors::{Any, CorsLayer};
use tower_http::trace::TraceLayer;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    dotenvy::dotenv().ok();

    // Validate JWT_SECRET on startup; panics if unset or under 32 bytes
    let _ = auth::get_jwt_secret();

    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "brightloop_backend=debug,tower_http=debug,axum=trace".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    tracing::info!("Initializing Brightloop Subscription Management System...");

    let database_url = std::env::var("DATABASE_URL")
        .unwrap_or_else(|_| "postgres://postgres:postgres@localhost:5432/brightloop".to_string());

    tracing::info!("Connecting to PostgreSQL database at: {}", database_url);

    let pool = sqlx::postgres::PgPoolOptions::new()
        .max_connections(20)
        .acquire_timeout(std::time::Duration::from_secs(5))
        .connect(&database_url)
        .await?;

    tracing::info!("Connected to PostgreSQL successfully.");

    tracing::info!("Executing database migrations from ./migrations/001_init.sql...");
    let migration_sql = include_str!("../migrations/001_init.sql");
    sqlx::raw_sql(migration_sql).execute(&pool).await?;
    let migration_002 = include_str!("../migrations/002_fk_restrict.sql");
    sqlx::raw_sql(migration_002).execute(&pool).await?;
    tracing::info!("Migrations executed successfully.");

    seed::seed_database(&pool).await?;

    // Step 3: Spawn In-Process Background Recurring Billing Engine
    billing::start_billing_worker(pool.clone());

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    let app = routes::create_router(pool)
        .layer(cors)
        .layer(TraceLayer::new_for_http());

    let port = std::env::var("PORT")
        .ok()
        .and_then(|p| p.parse().ok())
        .unwrap_or(3000);

    let addr = SocketAddr::from(([0, 0, 0, 0], port));
    tracing::info!("Brightloop Backend API listening on http://{}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}
