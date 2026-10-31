import React, { useState } from 'react';
import { Calendar, Plus, Trash2 } from 'lucide-react';
import { createPlan, deletePlan } from '../../api';
import { Plan } from '../../types';

interface PlanConfiguratorProps {
  plans: Plan[];
  onRefresh: () => void;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

export const PlanConfigurator: React.FC<PlanConfiguratorProps> = ({
  plans,
  onRefresh,
  onSuccess,
  onError,
}) => {
  const [name, setName] = useState('');
  const [interval, setInterval] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [price, setPrice] = useState(49);
  const [minQty, setMinQty] = useState(1);
  const [autoClose, setAutoClose] = useState(false);
  const [allowEarlyClose, setAllowEarlyClose] = useState(true);
  const [allowPause, setAllowPause] = useState(true);
  const [allowRenew, setAllowRenew] = useState(true);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createPlan({
        name,
        billing_interval: interval,
        plan_price: Number(price),
        min_quantity: Number(minQty),
        available_from: new Date().toISOString().split('T')[0],
        auto_close: autoClose,
        allow_early_close: allowEarlyClose,
        allow_pause: allowPause,
        allow_renew: allowRenew,
      });
      onSuccess(`Plan "${name}" created.`);
      setName('');
      onRefresh();
    } catch (err: unknown) {
      onError(err instanceof Error ? err.message : 'Failed to create plan');
    }
  };

  const handleDelete = async (id: string, pName: string) => {
    if (!confirm(`Delete plan "${pName}"?`)) return;
    try {
      await deletePlan(id);
      onSuccess(`Deleted plan "${pName}"`);
      onRefresh();
    } catch (err: unknown) {
      onError(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#0A0A0A] border border-[#222222] rounded-xl p-5">
        <h3 className="font-semibold text-xs tracking-wider uppercase text-[#888888] flex items-center gap-2 mb-4">
          <Calendar className="w-3.5 h-3.5 text-white" />
          <span>Configure Subscription Plan</span>
        </h3>
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <input
              type="text" placeholder="Plan Name (e.g. Pro Monthly)" value={name} onChange={(e) => setName(e.target.value)} required
              className="text-xs bg-[#000000] border border-[#222222] focus:border-white rounded-md px-3 py-2 text-[#EDEDED] placeholder-[#555555] outline-none transition"
            />
            <select
              value={interval} onChange={(e) => setInterval(e.target.value as any)}
              className="text-xs bg-[#000000] border border-[#222222] focus:border-white rounded-md px-3 py-2 text-[#EDEDED] outline-none transition"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
            <input
              type="number" step="0.01" placeholder="Plan Price (USD)" value={price} onChange={(e) => setPrice(Number(e.target.value))} required
              className="text-xs font-mono bg-[#000000] border border-[#222222] focus:border-white rounded-md px-3 py-2 text-[#EDEDED] placeholder-[#555555] outline-none transition"
            />
            <input
              type="number" placeholder="Min Quantity" value={minQty} onChange={(e) => setMinQty(Number(e.target.value))} required min={1}
              className="text-xs font-mono bg-[#000000] border border-[#222222] focus:border-white rounded-md px-3 py-2 text-[#EDEDED] placeholder-[#555555] outline-none transition"
            />
          </div>

          <div className="flex flex-wrap items-center gap-6 p-3 bg-[#000000] rounded-lg border border-[#222222] text-xs">
            <label className="flex items-center gap-2 cursor-pointer font-mono text-xs text-[#CCCCCC]">
              <input type="checkbox" checked={autoClose} onChange={(e) => setAutoClose(e.target.checked)} className="rounded border-[#333333] accent-white" />
              <span>Auto Close upon Expiry</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer font-mono text-xs text-[#CCCCCC]">
              <input type="checkbox" checked={allowEarlyClose} onChange={(e) => setAllowEarlyClose(e.target.checked)} className="rounded border-[#333333] accent-white" />
              <span>Allow Early Close</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer font-mono text-xs text-[#CCCCCC]">
              <input type="checkbox" checked={allowPause} onChange={(e) => setAllowPause(e.target.checked)} className="rounded border-[#333333] accent-white" />
              <span>Allow Pause</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer font-mono text-xs text-[#CCCCCC]">
              <input type="checkbox" checked={allowRenew} onChange={(e) => setAllowRenew(e.target.checked)} className="rounded border-[#333333] accent-white" />
              <span>Allow Renewal</span>
            </label>
          </div>

          <button type="submit" disabled={!name} className="flex items-center gap-1.5 bg-white hover:bg-[#EAEAEA] text-black text-xs font-semibold rounded-md px-4 py-2 transition disabled:opacity-40">
            <Plus className="w-3.5 h-3.5" />
            <span>Create Plan</span>
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {plans.map((p) => (
          <div key={p.id} className="bg-[#0A0A0A] border border-[#222222] rounded-xl p-4 hover:border-[#333333] transition">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-semibold text-sm text-[#EDEDED]">{p.name}</h4>
                <div className="text-xs text-[#888888] font-mono mt-0.5">
                  <span className="capitalize text-[#0070F3] font-medium">{p.billing_interval}</span> &bull; <span className="tabular-nums font-semibold text-white">${p.plan_price}</span> (Min seats: {p.min_quantity})
                </div>
              </div>
              <button onClick={() => handleDelete(p.id, p.name)} className="text-[#666666] hover:text-[#EE0000] p-1 transition">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="mt-3 pt-3 border-t border-[#161616] flex flex-wrap gap-1.5 text-[10px] font-mono">
              <span className={`px-2 py-0.5 rounded border ${p.auto_close ? 'bg-amber-950/40 border-amber-800/60 text-amber-300' : 'bg-[#111111] border-[#222222] text-[#888888]'}`}>
                {p.auto_close ? 'Auto-Close' : 'No Auto-Close'}
              </span>
              <span className={`px-2 py-0.5 rounded border ${p.allow_pause ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300' : 'bg-rose-950/40 border-rose-800/60 text-rose-300'}`}>
                {p.allow_pause ? 'Pause: Yes' : 'Pause: No'}
              </span>
              <span className={`px-2 py-0.5 rounded border ${p.allow_early_close ? 'bg-blue-950/40 border-blue-800/60 text-blue-300' : 'bg-rose-950/40 border-rose-800/60 text-rose-300'}`}>
                {p.allow_early_close ? 'Early Close: Yes' : 'Early Close: No'}
              </span>
              <span className={`px-2 py-0.5 rounded border ${p.allow_renew ? 'bg-purple-950/40 border-purple-800/60 text-purple-300' : 'bg-[#111111] border-[#222222] text-[#888888]'}`}>
                {p.allow_renew ? 'Renew: Yes' : 'Renew: No'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
