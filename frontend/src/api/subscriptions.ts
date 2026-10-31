import { request } from './client';
import { SubscriptionWithLines, SubscriptionStatus } from '../types';

export async function getSubscriptions(): Promise<SubscriptionWithLines[]> {
  return request<SubscriptionWithLines[]>('/subscriptions');
}

export async function createSubscription(payload: {
  customer_id: string;
  plan_id: string;
  start_date?: string;
  expiry_date?: string;
  next_billing_date?: string;
  payment_terms_days?: number;
  applied_discount_id?: string;
  lines: {
    product_id: string;
    variant_id?: string;
    quantity: number;
    unit_price: number;
    tax_rate?: number;
  }[];
}): Promise<SubscriptionWithLines> {
  return request<SubscriptionWithLines>('/subscriptions', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function createFromTemplate(payload: {
  template_id: string;
  customer_id: string;
}): Promise<SubscriptionWithLines> {
  return request<SubscriptionWithLines>('/subscriptions/from-template', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateSubscriptionStatus(
  id: string,
  status: SubscriptionStatus
): Promise<SubscriptionWithLines> {
  return request<SubscriptionWithLines>(`/subscriptions/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export async function renewSubscription(id: string): Promise<SubscriptionWithLines> {
  return request<SubscriptionWithLines>(`/subscriptions/${id}/renew`, {
    method: 'POST',
  });
}

export async function getPortalSubscriptions(): Promise<SubscriptionWithLines[]> {
  return request<SubscriptionWithLines[]>('/portal/subscriptions');
}

export async function toggleAddon(
  subscriptionId: string,
  payload: { addon_product_id: string; variant_id?: string }
): Promise<{ action: string; subscription: SubscriptionWithLines }> {
  return request<{ action: string; subscription: SubscriptionWithLines }>(
    `/portal/subscriptions/${subscriptionId}/toggle-addon`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );
}
