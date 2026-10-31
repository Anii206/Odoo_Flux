use axum::{
    extract::{Path, State},
    Json,
};
use serde_json::json;
use sqlx::PgPool;
use uuid::Uuid;

use crate::{
    auth::RequireStaffOrAdmin,
    error::AppError,
    handlers::quotations::types::{CreateTemplateRequest, QuotationTemplateWithLines, UpdateTemplateRequest},
    models::{QuotationTemplate, QuotationTemplateLine},
};

pub async fn create_quotation_template(
    _staff: RequireStaffOrAdmin,
    State(pool): State<PgPool>,
    Json(payload): Json<CreateTemplateRequest>,
) -> Result<Json<QuotationTemplateWithLines>, AppError> {
    if payload.lines.is_empty() {
        return Err(AppError::BadRequest("Quotation template must contain at least one line.".into()));
    }

    let mut tx = pool.begin().await?;
    let template = sqlx::query_as::<_, QuotationTemplate>(
        r#"
        INSERT INTO quotation_templates (name, plan_id, validity_days)
        VALUES ($1, $2, $3)
        RETURNING id, name, plan_id, validity_days, created_at
        "#,
    )
    .bind(payload.name.trim())
    .bind(payload.plan_id)
    .bind(payload.validity_days.unwrap_or(30))
    .fetch_one(&mut *tx)
    .await?;

    let mut lines = Vec::new();
    for l in payload.lines {
        let line = sqlx::query_as::<_, QuotationTemplateLine>(
            r#"
            INSERT INTO quotation_template_lines (template_id, product_id, variant_id, quantity)
            VALUES ($1, $2, $3, $4)
            RETURNING id, template_id, product_id, variant_id, quantity, created_at
            "#,
        )
        .bind(template.id)
        .bind(l.product_id)
        .bind(l.variant_id)
        .bind(l.quantity)
        .fetch_one(&mut *tx)
        .await?;
        lines.push(line);
    }
    tx.commit().await?;

    Ok(Json(QuotationTemplateWithLines { template, lines }))
}

pub async fn update_quotation_template(
    _staff: RequireStaffOrAdmin,
    Path(id): Path<Uuid>,
    State(pool): State<PgPool>,
    Json(payload): Json<UpdateTemplateRequest>,
) -> Result<Json<QuotationTemplateWithLines>, AppError> {
    let ex = sqlx::query_as::<_, QuotationTemplate>(
        "SELECT id, name, plan_id, validity_days, created_at FROM quotation_templates WHERE id = $1",
    )
    .bind(id)
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::NotFound(format!("Quotation template {} not found", id)))?;

    let mut tx = pool.begin().await?;
    let template = sqlx::query_as::<_, QuotationTemplate>(
        r#"
        UPDATE quotation_templates
        SET name = $1, plan_id = $2, validity_days = $3
        WHERE id = $4
        RETURNING id, name, plan_id, validity_days, created_at
        "#,
    )
    .bind(payload.name.unwrap_or(ex.name).trim())
    .bind(payload.plan_id.unwrap_or(ex.plan_id))
    .bind(payload.validity_days.unwrap_or(ex.validity_days))
    .bind(id)
    .fetch_one(&mut *tx)
    .await?;

    if let Some(new_lines) = payload.lines {
        sqlx::query("DELETE FROM quotation_template_lines WHERE template_id = $1")
            .bind(id)
            .execute(&mut *tx)
            .await?;
        for l in new_lines {
            sqlx::query(
                "INSERT INTO quotation_template_lines (template_id, product_id, variant_id, quantity) VALUES ($1, $2, $3, $4)",
            )
            .bind(id)
            .bind(l.product_id)
            .bind(l.variant_id)
            .bind(l.quantity)
            .execute(&mut *tx)
            .await?;
        }
    }

    let lines = sqlx::query_as::<_, QuotationTemplateLine>(
        "SELECT id, template_id, product_id, variant_id, quantity, created_at FROM quotation_template_lines WHERE template_id = $1",
    )
    .bind(id)
    .fetch_all(&mut *tx)
    .await?;

    tx.commit().await?;

    Ok(Json(QuotationTemplateWithLines { template, lines }))
}

pub async fn delete_quotation_template(
    _staff: RequireStaffOrAdmin,
    Path(id): Path<Uuid>,
    State(pool): State<PgPool>,
) -> Result<Json<serde_json::Value>, AppError> {
    let res = sqlx::query("DELETE FROM quotation_templates WHERE id = $1")
        .bind(id)
        .execute(&pool)
        .await?;

    if res.rows_affected() == 0 {
        return Err(AppError::NotFound(format!("Quotation template {} not found", id)));
    }

    Ok(Json(json!({ "success": true, "message": format!("Quotation template {} deleted.", id), "id": id })))
}
