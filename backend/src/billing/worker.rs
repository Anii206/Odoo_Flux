use sqlx::PgPool;
use std::time::Duration;
use tracing::{error, info};

use crate::billing::engine::run_billing_cycle;

pub fn start_billing_worker(pool: PgPool) {
    tokio::spawn(async move {
        info!("In-process background billing engine worker started (interval: 60s).");
        let mut interval = tokio::time::interval(Duration::from_secs(60));
        loop {
            interval.tick().await;
            let today = chrono::Utc::now().date_naive();
            match run_billing_cycle(&pool, today).await {
                Ok(result) => {
                    if result.invoices_generated > 0 || result.subscriptions_closed > 0 {
                        info!(
                            "Recurring billing cycle ran for {}: {} invoices generated, {} auto-closed.",
                            today, result.invoices_generated, result.subscriptions_closed
                        );
                    }
                }
                Err(err) => {
                    error!("Error during recurring billing cycle: {:?}", err);
                }
            }
        }
    });
}
