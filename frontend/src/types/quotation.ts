export interface QuotationTemplateLine {
  id: string;
  template_id: string;
  product_id: string;
  variant_id: string | null;
  quantity: number;
  created_at: string;
}

export interface QuotationTemplateWithLines {
  template: {
    id: string;
    name: string;
    plan_id: string;
    validity_days: number;
    created_at: string;
  };
  lines: QuotationTemplateLine[];
}
