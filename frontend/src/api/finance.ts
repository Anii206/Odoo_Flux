import { request } from './client';
import { Invoice } from '../types';

export interface FinanceMetrics {
  active_subscriptions_count: number;
  mrr: string | number;
  arr: string | number;
  collected_revenue: string | number;
  outstanding_revenue: string | number;
  overdue_invoices_count: number;
}

export interface FinanceDashboardResponse {
  metrics: FinanceMetrics;
  overdue_invoices: Invoice[];
  page: number;
  page_size: number;
  total_overdue_pages: number;
}

export async function getFinanceDashboard(params: {
  page?: number;
  page_size?: number;
  status?: string;
  customer_id?: string;
  from_date?: string;
  to_date?: string;
} = {}): Promise<FinanceDashboardResponse> {
  const query = new URLSearchParams();
  if (params.page) query.append('page', params.page.toString());
  if (params.page_size) query.append('page_size', params.page_size.toString());
  if (params.status) query.append('status', params.status);
  if (params.customer_id) query.append('customer_id', params.customer_id);
  if (params.from_date) query.append('from_date', params.from_date);
  if (params.to_date) query.append('to_date', params.to_date);

  const qs = query.toString();
  return request<FinanceDashboardResponse>(`/finance/dashboard${qs ? `?${qs}` : ''}`);
}

export async function bulkSeed(): Promise<{
  success: boolean;
  subscriptions_seeded: number;
  elapsed_ms: number;
  under_1_second: boolean;
}> {
  return request('/dev/seed', { method: 'POST' });
}
