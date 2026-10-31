use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::models::{QuotationTemplate, QuotationTemplateLine};

#[derive(Debug, Serialize, Deserialize)]
pub struct QuotationTemplateWithLines {
    pub template: QuotationTemplate,
    pub lines: Vec<QuotationTemplateLine>,
}

#[derive(Debug, Deserialize)]
pub struct TemplateLineInput {
    pub product_id: Uuid,
    pub variant_id: Option<Uuid>,
    pub quantity: i32,
}

#[derive(Debug, Deserialize)]
pub struct CreateTemplateRequest {
    pub name: String,
    pub plan_id: Uuid,
    pub validity_days: Option<i32>,
    pub lines: Vec<TemplateLineInput>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateTemplateRequest {
    pub name: Option<String>,
    pub plan_id: Option<Uuid>,
    pub validity_days: Option<i32>,
    pub lines: Option<Vec<TemplateLineInput>>,
}
