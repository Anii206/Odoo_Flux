import React, { useState, useEffect, useCallback } from 'react';
import { getPortalSubscriptions, getInvoices, getProducts, getPlans } from '../api';
import { SubscriptionWithLines, InvoiceWithLines, ProductWithVariants, Plan } from '../types';
import { PortalView } from '../components/portal/PortalView';

interface PortalPageProps {
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

export const PortalPage: React.FC<PortalPageProps> = ({ onSuccess, onError }) => {
  const [subscriptions, setSubscriptions] = useState<SubscriptionWithLines[]>([]);
  const [invoices, setInvoices] = useState<InvoiceWithLines[]>([]);
  const [products, setProducts] = useState<ProductWithVariants[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPortalData = useCallback(async () => {
    try {
      setLoading(true);
      const [subs, invs, prods, pls] = await Promise.all([
        getPortalSubscriptions(),
        getInvoices(),
        getProducts(),
        getPlans(),
      ]);
      setSubscriptions(subs);
      setInvoices(invs);
      setProducts(prods);
      setPlans(pls);
    } catch (err: unknown) {
      if (err instanceof Error) onError(err.message);
    } finally {
      setLoading(false);
    }
  }, [onError]);

  useEffect(() => {
    loadPortalData();
  }, [loadPortalData]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 font-sans text-[#EDEDED]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222222] pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Customer Portal</h1>
          <p className="text-xs font-mono text-[#888888] mt-1">
            Zero-friction customer self-service: manage active services, toggle add-ons, and download tax receipts.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 font-semibold text-sm">
          Loading your customer subscriptions...
        </div>
      ) : (
        <PortalView
          subscriptions={subscriptions}
          invoices={invoices}
          products={products}
          plans={plans}
          onRefresh={loadPortalData}
          onSuccess={onSuccess}
          onError={onError}
        />
      )}
    </div>
  );
};
