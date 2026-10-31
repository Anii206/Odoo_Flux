import { useState, useEffect, useCallback } from 'react';
import { getSubscriptions, getInvoices } from '../api';
import { SubscriptionWithLines, InvoiceWithLines } from '../types';

export function useBillingData(onError?: (error: string) => void) {
  const [subscriptions, setSubscriptions] = useState<SubscriptionWithLines[]>([]);
  const [invoices, setInvoices] = useState<InvoiceWithLines[]>([]);

  const loadBilling = useCallback(async () => {
    try {
      const [s, inv] = await Promise.all([getSubscriptions(), getInvoices()]);
      setSubscriptions(s);
      setInvoices(inv);
    } catch (err: unknown) {
      if (onError && err instanceof Error) onError(err.message);
    }
  }, [onError]);

  useEffect(() => {
    loadBilling();
  }, [loadBilling]);

  return { subscriptions, invoices, loadBilling, refresh: loadBilling };
}
