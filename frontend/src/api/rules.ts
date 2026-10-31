import { request } from './client';
import { DiscountRule, QuotationTemplateWithLines, TaxRule } from '../types';

export async function getTaxRules(): Promise<TaxRule[]> {
  return request<TaxRule[]>('/tax-rules');
}

export async function createTaxRule(payload: {
  name: string;
  rate_percentage: number;
  is_active?: boolean;
}): Promise<TaxRule> {
  return request<TaxRule>('/tax-rules', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function deleteTaxRule(id: string): Promise<void> {
  return request<void>(`/tax-rules/${id}`, { method: 'DELETE' });
}

export async function getDiscountRules(): Promise<DiscountRule[]> {
  return request<DiscountRule[]>('/discount-rules');
}

export async function createDiscountRule(payload: {
  name: string;
  discount_type: 'fixed' | 'percentage';
  value: number;
  min_purchase_amount?: number;
  min_quantity?: number;
  start_date: string;
  end_date?: string;
  max_uses?: number;
  applies_to: 'all' | 'product';
  target_product_id?: string;
}): Promise<DiscountRule> {
  return request<DiscountRule>('/discount-rules', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function deleteDiscountRule(id: string): Promise<void> {
  return request<void>(`/discount-rules/${id}`, { method: 'DELETE' });
}

export async function getQuotationTemplates(): Promise<QuotationTemplateWithLines[]> {
  return request<QuotationTemplateWithLines[]>('/quotation-templates');
}

export async function createQuotationTemplate(payload: {
  name: string;
  plan_id: string;
  validity_days?: number;
  lines: { product_id: string; variant_id?: string; quantity: number }[];
}): Promise<QuotationTemplateWithLines> {
  return request<QuotationTemplateWithLines>('/quotation-templates', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function deleteQuotationTemplate(id: string): Promise<void> {
  return request<void>(`/quotation-templates/${id}`, { method: 'DELETE' });
}
