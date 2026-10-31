use chrono::NaiveDate;
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};

use crate::models::{Invoice, Payment};

#[derive(Debug, Deserialize)]
pub struct RecordPaymentRequest {
    pub payment_method: String, // 'bank_transfer', 'card', 'upi', 'cash'
    pub amount: Decimal,
    pub payment_date: Option<NaiveDate>,
    pub note: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct RecordPaymentResponse {
    pub payment: Payment,
    pub invoice: Invoice,
}
