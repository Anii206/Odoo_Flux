import React, { useState, useEffect } from 'react';
import { Layers, FileText, BarChart3 } from 'lucide-react';
import { useBillingData, useRulesData, useCatalogData } from '../hooks';
import { getUsers } from '../api';
import { User } from '../types';
import { SubscriptionsView } from '../components/workspace/SubscriptionsView';
import { InvoicesView } from '../components/workspace/InvoicesView';
import { FinanceDashboardView } from '../components/workspace/FinanceDashboardView';

interface WorkspacePageProps {
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

export const WorkspacePage: React.FC<WorkspacePageProps> = ({ onSuccess, onError }) => {
  const [tab, setTab] = useState<'subscriptions' | 'invoices' | 'finance'>('subscriptions');
  const [users, setUsers] = useState<User[]>([]);

  const { subscriptions, invoices, refresh: refreshBilling } = useBillingData();
  const { quotationTemplates, refresh: refreshRules } = useRulesData();
  const { plans, refresh: refreshCatalog } = useCatalogData();

  useEffect(() => {
    getUsers().then(setUsers).catch(() => {});
  }, []);

  const refreshAll = () => {
    refreshBilling();
    refreshRules();
    refreshCatalog();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 font-sans text-[#EDEDED]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222222] pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Internal Team ERP Workspace</h1>
          <p className="text-xs font-mono text-[#888888] mt-1">Lifecycle state machine, billing intervals, payments & financial operations</p>
        </div>
      </div>

      <div className="flex items-center gap-1 border-b border-[#222222] overflow-x-auto text-xs font-mono">
        <button
          onClick={() => setTab('subscriptions')}
          className={`flex items-center gap-1.5 px-4 py-2.5 font-medium border-b-2 transition-all ${
            tab === 'subscriptions' ? 'border-white text-white font-bold' : 'border-transparent text-[#888888] hover:text-[#CCCCCC]'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Subscriptions ({subscriptions.length})</span>
        </button>
        <button
          onClick={() => setTab('invoices')}
          className={`flex items-center gap-1.5 px-4 py-2.5 font-medium border-b-2 transition-all ${
            tab === 'invoices' ? 'border-white text-white font-bold' : 'border-transparent text-[#888888] hover:text-[#CCCCCC]'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Invoices ({invoices.length})</span>
        </button>
        <button
          onClick={() => setTab('finance')}
          className={`flex items-center gap-1.5 px-4 py-2.5 font-medium border-b-2 transition-all ${
            tab === 'finance' ? 'border-white text-white font-bold' : 'border-transparent text-[#888888] hover:text-[#CCCCCC]'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Finance Telemetry</span>
        </button>
      </div>

      {tab === 'subscriptions' && (
        <SubscriptionsView
          subscriptions={subscriptions}
          templates={quotationTemplates}
          plans={plans}
          users={users}
          onRefresh={refreshAll}
          onSuccess={onSuccess}
          onError={onError}
        />
      )}

      {tab === 'invoices' && (
        <InvoicesView
          invoices={invoices}
          users={users}
          onRefresh={refreshAll}
          onSuccess={onSuccess}
          onError={onError}
        />
      )}

      {tab === 'finance' && (
        <FinanceDashboardView onSuccess={onSuccess} onError={onError} />
      )}
    </div>
  );
};
