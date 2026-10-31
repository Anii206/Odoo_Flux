use axum::{
    extract::{Path, State},
    Json,
};
use sqlx::PgPool;
use uuid::Uuid;

use crate::{
    auth::AuthenticatedUser,
    error::AppError,
    handlers::quotations::types::QuotationTemplateWithLines,
    models::{QuotationTemplate, QuotationTemplateLine},
};

pub async fn list_quotation_templates(
    _auth: AuthenticatedUser,
    State(pool): State<PgPool>,
) -> Result<Json<Vec<QuotationTemplateWithLines>>, AppError> {
    let templates = sqlx::query_as::<_, QuotationTemplate>(
        "SELECT id, name, plan_id, validity_days, created_at FROM quotation_templates ORDER BY created_at DESC",
    )
    .fetch_all(&pool)
    .await?;

    let lines = sqlx::query_as::<_, QuotationTemplateLine>(
        "SELECT id, template_id, product_id, variant_id, quantity, created_at FROM quotation_template_lines",
    )
    .fetch_all(&pool)
    .await?;

    let result = templates
        .into_iter()
        .map(|t| {
            let t_lines = lines.iter().filter(|l| l.template_id == t.id).cloned().collect();
            QuotationTemplateWithLines { template: t, lines: t_lines }
        })
        .collect();

    Ok(Json(result))
}

pub async fn get_quotation_template(
    _auth: AuthenticatedUser,
    Path(id): Path<Uuid>,
    State(pool): State<PgPool>,
) -> Result<Json<QuotationTemplateWithLines>, AppError> {
    let template = sqlx::query_as::<_, QuotationTemplate>(
        "SELECT id, name, plan_id, validity_days, created_at FROM quotation_templates WHERE id = $1",
    )
    .bind(id)
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::NotFound(format!("Quotation template {} not found", id)))?;

    let lines = sqlx::query_as::<_, QuotationTemplateLine>(
        "SELECT id, template_id, product_id, variant_id, quantity, created_at FROM quotation_template_lines WHERE template_id = $1",
    )
    .bind(id)
    .fetch_all(&pool)
    .await?;

    Ok(Json(QuotationTemplateWithLines { template, lines }))
}
