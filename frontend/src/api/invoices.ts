import { request, getToken } from './client';
import { InvoiceWithLines, InvoiceStatus, Payment } from '../types';

export async function getInvoices(): Promise<InvoiceWithLines[]> {
  return request<InvoiceWithLines[]>('/invoices');
}

export async function updateInvoiceStatus(
  id: string,
  status: InvoiceStatus
): Promise<InvoiceWithLines> {
  return request<InvoiceWithLines>(`/invoices/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export async function recordPayment(
  invoiceId: string,
  payload: {
    payment_method: 'bank_transfer' | 'card' | 'upi' | 'cash';
    amount: number;
    payment_date?: string;
    note?: string;
  }
): Promise<{ payment: Payment; invoice: InvoiceWithLines['invoice'] }> {
  return request<{ payment: Payment; invoice: InvoiceWithLines['invoice'] }>(
    `/invoices/${invoiceId}/payments`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );
}

export async function getPayments(invoiceId: string): Promise<Payment[]> {
  return request<Payment[]>(`/invoices/${invoiceId}/payments`);
}

export async function runBillingCycle(payload: {
  target_date?: string;
}): Promise<{
  target_date: string;
  subscriptions_scanned: number;
  invoices_generated: number;
  subscriptions_closed: number;
}> {
  return request('/billing/run', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function sendInvoiceReminder(
  invoiceId: string
): Promise<{ success: boolean; message: string; recipient: string }> {
  return request<{ success: boolean; message: string; recipient: string }>(
    `/invoices/${invoiceId}/remind`,
    { method: 'POST' }
  );
}

export function getInvoicePrintUrl(invoiceId: string): string {
  const token = getToken();
  return `http://localhost:3000/api/invoices/${invoiceId}/print${token ? `?token=${encodeURIComponent(token)}` : ''}`;
}
