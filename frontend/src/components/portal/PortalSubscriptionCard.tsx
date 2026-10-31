import React from 'react';
import { Plus, Trash2, Pause, Play, XCircle, Shield } from 'lucide-react';
import { SubscriptionWithLines, ProductWithVariants, Plan } from '../../types';
import { VercelStatusPill } from '../common/VercelStatusPill';

interface PortalSubscriptionCardProps {
  item: SubscriptionWithLines;
  addons: ProductWithVariants[];
  plan: Plan | undefined;
  isBusy: boolean;
  onToggleAddon: (subId: string, addonId: string, name: string) => void;
  onStatusChange: (subId: string, targetStatus: 'paused' | 'active' | 'closed') => void;
}

export const PortalSubscriptionCard: React.FC<PortalSubscriptionCardProps> = ({
  item: { subscription: sub, lines },
  addons,
  plan,
  isBusy,
  onToggleAddon,
  onStatusChange,
}) => {
  return (
    <div className="bg-[#0A0A0A] border border-[#222222] rounded-lg p-4 space-y-3 font-sans text-[#EDEDED]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1A1A1A] pb-3">
        <div className="font-mono">
          <span className="font-bold text-white text-sm">{sub.sub_number}</span>
          <span className="ml-2 text-xs text-[#888888]">Next Billing: {sub.next_billing_date}</span>
          {plan && <span className="ml-2 text-xs text-[#555555]">({plan.name})</span>}
        </div>
        <div className="flex items-center gap-2 font-sans">
          <VercelStatusPill status={sub.status} />
          {sub.status === 'active' && plan?.allow_pause && (
            <button disabled={isBusy} onClick={() => onStatusChange(sub.id, 'paused')} className="flex items-center gap-1 text-[11px] font-semibold text-[#F5A623] bg-[#F5A623]/10 hover:bg-[#F5A623]/20 px-2 py-0.5 rounded border border-[#F5A623]/30 transition">
              <Pause className="w-3 h-3" /><span>Pause</span>
            </button>
          )}
          {sub.status === 'paused' && (
            <button disabled={isBusy} onClick={() => onStatusChange(sub.id, 'active')} className="flex items-center gap-1 text-[11px] font-semibold text-[#10B981] bg-[#10B981]/10 hover:bg-[#10B981]/20 px-2 py-0.5 rounded border border-[#10B981]/30 transition">
              <Play className="w-3 h-3" /><span>Resume</span>
            </button>
          )}
          {sub.status !== 'closed' && plan?.allow_early_close && (
            <button disabled={isBusy} onClick={() => onStatusChange(sub.id, 'closed')} className="flex items-center gap-1 text-[11px] font-semibold text-[#EE0000] bg-[#EE0000]/10 hover:bg-[#EE0000]/20 px-2 py-0.5 rounded border border-[#EE0000]/30 transition">
              <XCircle className="w-3 h-3" /><span>Close</span>
            </button>
          )}
        </div>
      </div>

      {plan && (
        <div className="flex flex-wrap gap-2 text-[10px] font-mono text-[#888888] bg-[#111111] p-2 rounded border border-[#222222]">
          <span className="flex items-center gap-1 text-white font-bold"><Shield className="w-3 h-3 text-[#0070F3]" /> Plan Rules:</span>
          <span className={plan.allow_pause ? 'text-[#10B981]' : 'text-[#555555]'}>Pause: {plan.allow_pause ? 'Allowed' : 'Disabled'}</span>
          <span>·</span>
          <span className={plan.allow_early_close ? 'text-[#10B981]' : 'text-[#555555]'}>Early Close: {plan.allow_early_close ? 'Allowed' : 'Disabled'}</span>
          <span>·</span>
          <span className={plan.auto_close ? 'text-[#F5A623]' : 'text-[#555555]'}>Auto-Close: {plan.auto_close ? 'Yes' : 'No'}</span>
        </div>
      )}

      {sub.status === 'active' && addons.length > 0 && (
        <div>
          <div className="text-[11px] font-mono uppercase text-[#888888] mb-1.5">Self-Service Add-ons</div>
          <div className="flex flex-wrap gap-2">
            {addons.map(({ product: a }) => {
              const isAttached = lines.some((l) => l.product_id === a.id);
              return (
                <button
                  key={a.id}
                  disabled={isBusy}
                  onClick={() => onToggleAddon(sub.id, a.id, a.name)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono transition border ${
                    isAttached
                      ? 'bg-[#EE0000]/10 border-[#EE0000]/30 text-[#EE0000] hover:bg-[#EE0000]/20'
                      : 'bg-[#111111] border-[#222222] text-[#CCCCCC] hover:text-white hover:border-[#444444]'
                  }`}
                >
                  {isAttached ? <Trash2 className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                  <span>{isAttached ? `Remove ${a.name}` : `Add ${a.name} (+$${a.sales_price})`}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
