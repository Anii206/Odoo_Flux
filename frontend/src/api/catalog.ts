import { request } from './client';
import { Plan, ProductWithVariants, ProductVariant } from '../types';

export async function getProducts(): Promise<ProductWithVariants[]> {
  return request<ProductWithVariants[]>('/products');
}

export async function createProduct(payload: {
  name: string;
  product_type: 'software' | 'addon' | 'service';
  sales_price: number;
  cost_price: number;
  notes?: string;
  variants?: { attribute_name: string; attribute_value: string; price_extra: number }[];
}): Promise<ProductWithVariants> {
  return request<ProductWithVariants>('/products', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function deleteProduct(id: string): Promise<void> {
  return request<void>(`/products/${id}`, { method: 'DELETE' });
}

export async function createVariant(
  productId: string,
  payload: { attribute_name: string; attribute_value: string; price_extra: number }
): Promise<ProductVariant> {
  return request<ProductVariant>(`/products/${productId}/variants`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function deleteVariant(productId: string, variantId: string): Promise<void> {
  return request<void>(`/products/${productId}/variants/${variantId}`, { method: 'DELETE' });
}

export async function getPlans(): Promise<Plan[]> {
  return request<Plan[]>('/plans');
}

export async function createPlan(payload: {
  name: string;
  billing_interval: 'daily' | 'weekly' | 'monthly' | 'yearly';
  plan_price: number;
  min_quantity?: number;
  available_from: string;
  available_to?: string;
  auto_close?: boolean;
  allow_early_close?: boolean;
  allow_pause?: boolean;
  allow_renew?: boolean;
}): Promise<Plan> {
  return request<Plan>('/plans', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function deletePlan(id: string): Promise<void> {
  return request<void>(`/plans/${id}`, { method: 'DELETE' });
}
