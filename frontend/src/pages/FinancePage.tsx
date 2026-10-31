import React, { useState, useEffect, useCallback } from 'react';
import { getFinanceDashboard, sendInvoiceReminder, getUsers } from '../api';
import { useCatalogData } from '../hooks';
import { Invoice, User } from '../types';
import { FinanceMetrics } from '../api/finance';
import { FinanceKpiCards } from '../components/finance/FinanceKpiCards';
import { FinanceFilterBar } from '../components/finance/FinanceFilterBar';
import { RevenueChart } from '../components/finance/RevenueChart';
import { OverdueChaseTable } from '../components/finance/OverdueChaseTable';
import { RecordPaymentModal } from '../components/workspace/RecordPaymentModal';

interface FinancePageProps {
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

export const FinancePage: React.FC<FinancePageProps> = ({ onSuccess, onError }) => {
  const [metrics, setMetrics] = useState<FinanceMetrics | null>(null);
  const [overdueInvoices, setOverdueInvoices] = useState<Invoice[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [queryLatency, setQueryLatency] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingReminderId, setLoadingReminderId] = useState<string | null>(null);
  const [paymentInvoice, setPaymentInvoice] = useState<Invoice | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [planId, setPlanId] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const { plans } = useCatalogData();

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const t0 = performance.now();
      const res = await getFinanceDashboard({
        status: status || undefined,
        from_date: fromDate || undefined,
        to_date: toDate || undefined,
      });
      const t1 = performance.now();
      setQueryLatency(Math.max(1, Math.round(t1 - t0)));
      setMetrics(res.metrics);
      setOverdueInvoices(res.overdue_invoices);
    } catch (err: unknown) {
      if (err instanceof Error) onError(err.message);
    } finally {
      setLoading(false);
    }
  }, [status, fromDate, toDate, onError]);

  useEffect(() => {
    fetchDashboard();
    getUsers().then(setUsers).catch(() => {});
  }, [fetchDashboard]);

  const handleSendReminder = async (invoiceId: string, invoiceNum: string) => {
    try {
      setLoadingReminderId(invoiceId);
      const res = await sendInvoiceReminder(invoiceId);
      onSuccess(`Overdue payment reminder for ${invoiceNum} sent to ${res.recipient}! Check Outbox Drawer.`);
    } catch (err: unknown) {
      onError(err instanceof Error ? err.message : 'Failed to send reminder');
    } finally {
      setLoadingReminderId(null);
    }
  };

  const filteredInvoices = overdueInvoices.filter((inv) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const custEmail = users.find((u) => u.id === inv.customer_id)?.email.toLowerCase() || '';
    return inv.invoice_number.toLowerCase().includes(q) || custEmail.includes(q);
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="border-b border-[#222222] pb-4">
        <h1 className="text-2xl font-bold text-[#EDEDED] tracking-tight">Finance Lead Analytics & Receivables</h1>
        <p className="text-xs font-mono text-[#888888] mt-1">
          Real-time MRR, cash-flow velocity, and overdue receivables tracking with sub-2s query SLA guarantee.
        </p>
      </div>

      <FinanceKpiCards metrics={metrics} queryLatencyMs={queryLatency} onRefresh={fetchDashboard} loading={loading} />

      <FinanceFilterBar
        searchQuery={search}
        onSearchChange={setSearch}
        status={status}
        onStatusChange={setStatus}
        planId={planId}
        onPlanChange={setPlanId}
        fromDate={fromDate}
        onFromDateChange={setFromDate}
        toDate={toDate}
        onToDateChange={setToDate}
        plans={plans}
        onReset={() => { setSearch(''); setStatus(''); setPlanId(''); setFromDate(''); setToDate(''); }}
      />

      <RevenueChart
        invoices={filteredInvoices}
        collectedTotal={Number(metrics?.collected_revenue ?? 0)}
        outstandingTotal={Number(metrics?.outstanding_revenue ?? 0)}
      />

      <OverdueChaseTable
        invoices={filteredInvoices}
        users={users}
        onSendReminder={handleSendReminder}
        onRecordPayment={setPaymentInvoice}
        loadingReminderId={loadingReminderId}
      />

      <RecordPaymentModal
        invoiceId={paymentInvoice?.id ?? null}
        invoiceNumber={paymentInvoice?.invoice_number ?? ''}
        grandTotal={Number(paymentInvoice?.grand_total ?? 0)}
        amountPaid={Number(paymentInvoice?.amount_paid ?? 0)}
        onClose={() => setPaymentInvoice(null)}
        onRefresh={() => {
          fetchDashboard();
          setPaymentInvoice(null);
        }}
        onError={onError}
        onSuccess={onSuccess}
      />
    </div>
  );
};
