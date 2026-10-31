import React, { useState } from 'react';
import { Printer, CreditCard } from 'lucide-react';
import { toggleAddon, getInvoicePrintUrl, updateSubscriptionStatus } from '../../api';
import { SubscriptionWithLines, InvoiceWithLines, ProductWithVariants, Plan, Invoice } from '../../types';
import { PayInvoiceModal } from './PayInvoiceModal';
import { PortalSubscriptionCard } from './PortalSubscriptionCard';
import { VercelStatusPill } from '../common/VercelStatusPill';

interface PortalViewProps {
  subscriptions: SubscriptionWithLines[];
  invoices: InvoiceWithLines[];
  products: ProductWithVariants[];
  plans: Plan[];
  onRefresh: () => void;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

export const PortalView: React.FC<PortalViewProps> = ({
  subscriptions,
  invoices,
  products,
  plans,
  onRefresh,
  onSuccess,
  onError,
}) => {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [selectedPayInvoice, setSelectedPayInvoice] = useState<Invoice | null>(null);
  const addons = products.filter((p) => p.product.product_type === 'addon');

  const handleToggleAddon = async (subId: string, addonId: string, addonName: string) => {
    try {
      setLoadingAction(`addon-${subId}-${addonId}`);
      const res = await toggleAddon(subId, { addon_product_id: addonId });
      onSuccess(`Add-on "${addonName}" ${res.action === 'added' ? 'attached' : 'detached'}.`);
      onRefresh();
    } catch (err: unknown) {
      onError(err instanceof Error ? err.message : 'Toggle add-on failed');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleStatusChange = async (subId: string, targetStatus: 'paused' | 'active' | 'closed') => {
    try {
      setLoadingAction(`status-${subId}`);
      await updateSubscriptionStatus(subId, targetStatus);
      onSuccess(`Subscription moved to ${targetStatus.toUpperCase()}.`);
      onRefresh();
    } catch (err: unknown) {
      onError(err instanceof Error ? err.message : 'Status update failed');
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="space-y-6 font-sans text-[#EDEDED]">
      <div className="bg-[#0A0A0A] p-4 rounded-lg border border-[#222222]">
        <h3 className="font-bold text-sm tracking-tight text-white">Customer Self-Service Portal</h3>
        <p className="text-xs font-mono text-[#888888] mt-0.5">Manage active services, toggle self-service add-ons, and settle invoices online</p>
      </div>

      <div className="space-y-3">
        <h4 className="font-mono text-xs uppercase text-[#888888] tracking-wider">Your Active Subscriptions ({subscriptions.length})</h4>
        {subscriptions.map((item) => (
          <PortalSubscriptionCard
            key={item.subscription.id}
            item={item}
            addons={addons}
            plan={plans.find((p) => p.id === item.subscription.plan_id)}
            isBusy={loadingAction?.includes(item.subscription.id) ?? false}
            onToggleAddon={handleToggleAddon}
            onStatusChange={handleStatusChange}
          />
        ))}
      </div>

      <div className="space-y-3">
        <h4 className="font-mono text-xs uppercase text-[#888888] tracking-wider">Tax Invoices & Receipts ({invoices.length})</h4>
        <div className="bg-[#0A0A0A] border border-[#222222] rounded-lg divide-y divide-[#161616] overflow-hidden">
          {invoices.map(({ invoice: inv }) => {
            const isUnpaid = inv.status !== 'paid' && Number(inv.grand_total) > Number(inv.amount_paid);
            return (
              <div key={inv.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#111111] text-xs font-mono tabular-nums transition-colors">
                <div>
                  <span className="font-bold text-white">{inv.invoice_number}</span>
                  <span className="text-[#888888] ml-2">Due: {inv.due_date}</span>
                  <span className="text-white font-bold ml-3">${inv.grand_total}</span>
                </div>
                <div className="flex items-center gap-3">
                  <VercelStatusPill status={inv.status} />
                  {isUnpaid && (
                    <button onClick={() => setSelectedPayInvoice(inv)} className="flex items-center gap-1 px-2.5 py-1 rounded bg-white hover:bg-[#EAEAEA] text-black font-sans font-bold text-xs shadow-xs transition">
                      <CreditCard className="w-3 h-3" /><span>Pay Online</span>
                    </button>
                  )}
                  <a href={getInvoicePrintUrl(inv.id)} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[#888888] hover:text-white transition font-sans">
                    <Printer className="w-3 h-3" /><span>Print</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <PayInvoiceModal isOpen={selectedPayInvoice !== null} invoice={selectedPayInvoice} onClose={() => setSelectedPayInvoice(null)} onPaymentSuccess={onRefresh} onError={onError} onSuccess={onSuccess} />
    </div>
  );
};
