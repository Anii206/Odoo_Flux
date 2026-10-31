import { request } from './client';
import { SubscriptionWithLines, InvoiceWithLines } from '../types';

export const billingApi = {
  listSubscriptions: () => request<SubscriptionWithLines[]>('/subscriptions'),
  createSubscription: (payload: any) =>
    request<SubscriptionWithLines>('/subscriptions', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  listInvoices: () => request<InvoiceWithLines[]>('/invoices'),
  createInvoice: (payload: any) =>
    request<InvoiceWithLines>('/invoices', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};
