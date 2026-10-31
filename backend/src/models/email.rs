use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct LocalEmail {
    pub id: Uuid,
    pub recipient_email: String,
    pub subject: String,
    pub body_html: String,
    pub created_at: DateTime<Utc>,
}
