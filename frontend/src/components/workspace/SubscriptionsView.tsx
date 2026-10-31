import React, { useState } from 'react';
import { Play, Plus } from 'lucide-react';
import { updateSubscriptionStatus, renewSubscription, runBillingCycle } from '../../api';
import { SubscriptionWithLines, QuotationTemplateWithLines, User, Plan, SubscriptionStatus } from '../../types';
import { StatusRibbon } from './StatusRibbon';
import { NewFromTemplateModal } from './NewFromTemplateModal';

interface SubscriptionsViewProps {
  subscriptions: SubscriptionWithLines[];
  templates: QuotationTemplateWithLines[];
  plans: Plan[];
  users: User[];
  onRefresh: () => void;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

export const SubscriptionsView: React.FC<SubscriptionsViewProps> = ({
  subscriptions,
  templates,
  plans,
  users,
  onRefresh,
  onSuccess,
  onError,
}) => {
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [simulating, setSimulating] = useState(false);

  const handleStatusChange = async (id: string, subNumber: string, status: SubscriptionStatus) => {
    try {
      await updateSubscriptionStatus(id, status);
      onSuccess(`Subscription ${subNumber} transitioned to '${status}'.`);
      onRefresh();
    } catch (err: unknown) {
      onError(err instanceof Error ? err.message : 'Status transition failed');
    }
  };

  const handleRenew = async (id: string, subNumber: string) => {
    try {
      await renewSubscription(id);
      onSuccess(`Subscription ${subNumber} renewed successfully.`);
      onRefresh();
    } catch (err: unknown) {
      onError(err instanceof Error ? err.message : 'Renewal failed');
    }
  };

  const handleSimulateBilling = async () => {
    try {
      setSimulating(true);
      const res = await runBillingCycle({});
      onSuccess(`Billing cycle: ${res.invoices_generated} invoices generated, ${res.subscriptions_closed} closed.`);
      onRefresh();
    } catch (err: unknown) {
      onError(err instanceof Error ? err.message : 'Billing simulation failed');
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="space-y-4 font-sans text-[#EDEDED]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0A0A0A] p-4 rounded-lg border border-[#222222]">
        <div>
          <h3 className="font-bold text-sm tracking-tight text-white">Active Subscriptions & Lifecycle Contracts</h3>
          <p className="text-xs font-mono text-[#888888] mt-0.5">Strict state machine progression with plan rule validation</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleSimulateBilling} disabled={simulating} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono bg-[#111111] hover:bg-[#1A1A1A] border border-[#222222] text-[#CCCCCC] hover:text-white rounded-md transition disabled:opacity-50">
            <Play className={`w-3.5 h-3.5 ${simulating ? 'animate-spin' : ''}`} />
            <span>Simulate Billing</span>
          </button>
          <button onClick={() => setIsTemplateModalOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white hover:bg-[#EAEAEA] text-black rounded-md transition shadow-xs">
            <Plus className="w-3.5 h-3.5" />
            <span>New from Template</span>
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {subscriptions.map(({ subscription: sub, lines }) => {
          const plan = plans.find((p) => p.id === sub.plan_id);
          const cust = users.find((u) => u.id === sub.customer_id);

          return (
            <div
              key={sub.id}
              data-testid="subscription-card"
              data-sub-number={sub.sub_number}
              data-customer={cust?.email ?? ''}
              className="bg-[#0A0A0A] border border-[#222222] rounded-lg p-4 space-y-3 font-mono text-xs"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-[#1A1A1A] pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{sub.sub_number}</span>
                    <span className="text-[#888888]">{cust?.email ?? sub.customer_id}</span>
                    <span className="text-[#555555]">&bull; {plan?.name ?? 'Plan'}</span>
                  </div>
                  <div className="text-[10px] text-[#666666] mt-0.5">Start: {sub.start_date} · Next: {sub.next_billing_date} · Expiry: {sub.expiry_date ?? 'Perpetual'} · Payment Terms: {sub.payment_terms_days} days</div>
                </div>
                <StatusRibbon currentStatus={sub.status} />
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs tabular-nums">
                  <thead className="text-[#666666] text-[10px] uppercase border-b border-[#1A1A1A]">
                    <tr className="h-7"><th className="px-2">Item ID</th><th className="px-2 text-right">Qty</th><th className="px-2 text-right">Unit Price</th><th className="px-2 text-right">Tax</th><th className="px-2 text-right">Line Total</th></tr>
                  </thead>
                  <tbody className="divide-y divide-[#161616]">
                    {lines.map((l) => (
                      <tr key={l.id} className="h-8 hover:bg-[#111111] transition-colors">
                        <td className="px-2 text-[#AAAAAA]">{l.product_id.substring(0, 8)}...</td>
                        <td className="px-2 text-right text-[#888888]">{l.quantity}</td>
                        <td className="px-2 text-right text-[#888888]">${Number(l.unit_price).toFixed(2)}</td>
                        <td className="px-2 text-right text-[#888888]">{l.tax_rate}%</td>
                        <td className="px-2 text-right font-bold text-white">${Number(l.line_total).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-[#1A1A1A] font-sans">
                {sub.status === 'draft' && <button onClick={() => handleStatusChange(sub.id, sub.sub_number, 'quotation')} className="px-2.5 py-1 bg-white hover:bg-[#EAEAEA] text-black rounded text-xs font-bold transition">Send Quotation</button>}
                {sub.status === 'quotation' && <button onClick={() => handleStatusChange(sub.id, sub.sub_number, 'confirmed')} className="px-2.5 py-1 bg-white hover:bg-[#EAEAEA] text-black rounded text-xs font-bold transition">Confirm Order</button>}
                {sub.status === 'confirmed' && <button onClick={() => handleStatusChange(sub.id, sub.sub_number, 'active')} className="px-2.5 py-1 bg-[#10B981] hover:bg-[#0ea571] text-black rounded text-xs font-bold transition">Activate</button>}
                {sub.status === 'active' && (
                  plan?.allow_pause ? (
                    <button onClick={() => handleStatusChange(sub.id, sub.sub_number, 'paused')} className="px-2.5 py-1 bg-[#F5A623]/10 border border-[#F5A623]/30 text-[#F5A623] hover:bg-[#F5A623]/20 rounded text-xs font-medium transition">Pause</button>
                  ) : (
                    <button disabled title="Plan does not permit pausing" className="px-2.5 py-1 bg-[#222222] border border-[#333333] text-[#555555] cursor-not-allowed rounded text-xs font-medium transition disabled:opacity-40">Pause</button>
                  )
                )}
                {sub.status === 'paused' && <button onClick={() => handleStatusChange(sub.id, sub.sub_number, 'active')} className="px-2.5 py-1 bg-[#10B981]/10 border border-[#10B981]/30 text-[#10B981] hover:bg-[#10B981]/20 rounded text-xs font-medium transition">Resume</button>}
                {sub.status !== 'closed' && <button onClick={() => handleStatusChange(sub.id, sub.sub_number, 'closed')} className="px-2.5 py-1 bg-[#EE0000]/10 border border-[#EE0000]/30 text-[#EE0000] hover:bg-[#EE0000]/20 rounded text-xs font-medium transition">Close</button>}
                {plan?.allow_renew && <button onClick={() => handleRenew(sub.id, sub.sub_number)} className="px-2.5 py-1 bg-[#0070F3]/10 border border-[#0070F3]/30 text-[#0070F3] hover:bg-[#0070F3]/20 rounded text-xs font-medium transition">Renew</button>}
              </div>
            </div>
          );
        })}
      </div>

      <NewFromTemplateModal isOpen={isTemplateModalOpen} templates={templates} users={users} onClose={() => setIsTemplateModalOpen(false)} onSuccess={onSuccess} onError={onError} onRefresh={onRefresh} />
    </div>
  );
};
