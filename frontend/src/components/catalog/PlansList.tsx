import React from 'react';
import { Plan } from '../../types';

interface PlansListProps {
  plans: Plan[];
}

export const PlansList: React.FC<PlansListProps> = ({ plans }) => {
  return (
    <div className="pt-4 border-t border-slate-800">
      <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">
        Subscription Billing Plans
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {plans.map((pl) => (
          <div
            key={pl.id}
            className="p-5 rounded-xl border border-indigo-900/40 bg-gradient-to-b from-indigo-950/20 to-slate-950 space-y-3"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs uppercase font-semibold tracking-wider text-indigo-400">
                  {pl.billing_interval} interval
                </span>
                <h4 className="text-base font-bold text-white">{pl.name}</h4>
              </div>
              <div className="text-right font-mono text-xl font-bold text-white">
                ${Number(pl.plan_price).toFixed(2)}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs text-slate-400 pt-2 border-t border-slate-800/80">
              <div>
                Min Qty: <strong className="text-white font-mono">{pl.min_quantity}</strong>
              </div>
              <div>
                Available: <strong className="text-white font-mono">{pl.available_from}</strong>
              </div>
              <div>
                Auto-Close: <strong className="text-white">{pl.auto_close ? 'Yes' : 'No'}</strong>
              </div>
              <div>
                Allow Pause: <strong className="text-emerald-400">{pl.allow_pause ? 'Yes' : 'No'}</strong>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
