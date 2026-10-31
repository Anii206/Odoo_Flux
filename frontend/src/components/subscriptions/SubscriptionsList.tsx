import React from 'react';
import { SubscriptionWithLines } from '../../types';

interface SubscriptionsListProps {
  subscriptions: SubscriptionWithLines[];
}

export const SubscriptionsList: React.FC<SubscriptionsListProps> = ({ subscriptions }) => {
  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">
        Active & Quotation Subscriptions
      </h3>
      {subscriptions.length === 0 ? (
        <div className="text-center py-6 border border-slate-800/80 rounded-xl bg-slate-950/40 text-slate-500 text-xs">
          No subscriptions found for current role/user.
        </div>
      ) : (
        <div className="space-y-3">
          {subscriptions.map((s) => (
            <div
              key={s.subscription.id}
              className="p-4 rounded-xl border border-slate-800 bg-slate-950/80 flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white">{s.subscription.sub_number}</span>
                  <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                    {s.subscription.status}
                  </span>
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  Next Billing: <span className="font-mono text-slate-200">{s.subscription.next_billing_date}</span> &bull; Terms: {s.subscription.payment_terms_days} days
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400">{s.lines.length} Line items</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
