import React from 'react';
import { FileText } from 'lucide-react';
import { SubscriptionWithLines, InvoiceWithLines } from '../../types';
import { SubscriptionsList } from './SubscriptionsList';
import { InvoicesList } from './InvoicesList';

interface SubscriptionsSectionProps {
  subscriptions: SubscriptionWithLines[];
  invoices: InvoiceWithLines[];
}

export const SubscriptionsSection: React.FC<SubscriptionsSectionProps> = ({
  subscriptions,
  invoices,
}) => {
  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-400" />
            Subscriptions & Invoices (Anti-Double-Billing Protected)
          </h2>
          <p className="text-xs text-slate-400">
            PostgreSQL schema includes B-Tree indexes on <code>(status, next_billing_date)</code> and{' '}
            <code>(status, due_date)</code> plus{' '}
            <code className="text-emerald-300 font-mono">UNIQUE(subscription_id, billing_period_start)</code>.
          </p>
        </div>

        {/* Subscriptions section */}
        <SubscriptionsList subscriptions={subscriptions} />

        {/* Invoices section */}
        <InvoicesList invoices={invoices} />
      </div>
    </div>
  );
};
