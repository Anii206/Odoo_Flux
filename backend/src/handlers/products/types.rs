use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};

use crate::models::{Product, ProductVariant};

#[derive(Debug, Serialize, Deserialize)]
pub struct ProductWithVariants {
    pub product: Product,
    pub variants: Vec<ProductVariant>,
}

#[derive(Debug, Deserialize)]
pub struct CreateProductRequest {
    pub name: String,
    pub product_type: String, // 'software', 'addon', 'service'
    pub sales_price: Decimal,
    pub cost_price: Decimal,
    pub notes: Option<String>,
    pub variants: Option<Vec<crate::handlers::products::variants::CreateVariantRequest>>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateProductRequest {
    pub name: Option<String>,
    pub product_type: Option<String>,
    pub sales_price: Option<Decimal>,
    pub cost_price: Option<Decimal>,
    pub notes: Option<String>,
}
