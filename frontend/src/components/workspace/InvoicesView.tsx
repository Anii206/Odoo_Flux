import React, { useState } from 'react';
import { Printer, CreditCard, CheckCircle2 } from 'lucide-react';
import { updateInvoiceStatus, getInvoicePrintUrl } from '../../api';
import { InvoiceWithLines, User } from '../../types';
import { RecordPaymentModal } from './RecordPaymentModal';
import { VercelStatusPill } from '../common/VercelStatusPill';

interface InvoicesViewProps {
  invoices: InvoiceWithLines[];
  users: User[];
  onRefresh: () => void;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

export const InvoicesView: React.FC<InvoicesViewProps> = ({
  invoices,
  users,
  onRefresh,
  onSuccess,
  onError,
}) => {
  const [activePayment, setActivePayment] = useState<{ id: string; num: string; grand: number; paid: number } | null>(null);

  const handleConfirm = async (id: string, num: string) => {
    try {
      await updateInvoiceStatus(id, 'confirmed');
      onSuccess(`Invoice ${num} confirmed & email logged.`);
      onRefresh();
    } catch (err: unknown) {
      onError(err instanceof Error ? err.message : 'Confirmation failed');
    }
  };

  const handleBulkConfirm = async () => {
    const drafts = invoices.filter((i) => i.invoice.status === 'draft');
    if (drafts.length === 0) return;
    try {
      for (const d of drafts) {
        await updateInvoiceStatus(d.invoice.id, 'confirmed');
      }
      onSuccess(`Bulk confirmed ${drafts.length} draft invoices.`);
      onRefresh();
    } catch (err: unknown) {
      onError(err instanceof Error ? err.message : 'Bulk confirm failed');
    }
  };

  return (
    <div className="space-y-4 font-sans text-[#EDEDED]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0A0A0A] p-4 rounded-lg border border-[#222222]">
        <div>
          <h3 className="font-bold text-sm tracking-tight text-white">Billing & Invoices Ledger</h3>
          <p className="text-xs font-mono text-[#888888] mt-0.5">Automated recurring invoice generation, tracking, and settlements</p>
        </div>
        <button
          onClick={handleBulkConfirm}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white hover:bg-[#EAEAEA] text-black rounded-md transition shadow-xs"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Confirm All Drafts</span>
        </button>
      </div>

      <div className="bg-[#0A0A0A] border border-[#222222] rounded-lg overflow-hidden">
        <div className="overflow-x-auto max-h-[540px]">
          <table className="w-full text-left text-xs font-mono tabular-nums">
            <thead className="sticky top-0 backdrop-blur-md bg-black/80 z-10 border-b border-[#222222] text-[#888888] uppercase text-[10px] tracking-wider">
              <tr className="h-9">
                <th className="px-4">Invoice #</th>
                <th className="px-4">Customer</th>
                <th className="px-4">Period</th>
                <th className="px-4 text-right">Grand Total</th>
                <th className="px-4 text-right">Paid</th>
                <th className="px-4 text-center">Status</th>
                <th className="px-4 text-right font-sans">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#161616]">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#555555] font-sans">
                    No invoices generated yet. Run billing cycle to create initial invoices.
                  </td>
                </tr>
              ) : (
                invoices.map(({ invoice: inv }) => {
                  const cust = users.find((u) => u.id === inv.customer_id);
                  const isPaid = inv.status === 'paid' || Number(inv.amount_paid) >= Number(inv.grand_total);

                  return (
                    <tr key={inv.id} data-testid="invoice-row" className="h-10 hover:bg-[#111111] transition-colors">
                      <td className="px-4 font-bold text-white">{inv.invoice_number}</td>
                      <td className="px-4 text-[#AAAAAA] truncate max-w-[180px]">{cust?.email ?? inv.customer_id}</td>
                      <td className="px-4 text-[#777777] text-[11px]">{inv.billing_period_start} to {inv.billing_period_end}</td>
                      <td className="px-4 text-right font-bold text-white">${inv.grand_total}</td>
                      <td className="px-4 text-right text-[#888888]">${inv.amount_paid}</td>
                      <td className="px-4 text-center">
                        <VercelStatusPill status={isPaid ? 'paid' : inv.status} />
                      </td>
                      <td className="px-4 text-right space-x-2 font-sans">
                        {inv.status === 'draft' && (
                          <button onClick={() => handleConfirm(inv.id, inv.invoice_number)} className="px-2 py-0.5 rounded bg-white hover:bg-[#EAEAEA] text-black font-semibold text-xs transition">
                            Confirm
                          </button>
                        )}
                        {!isPaid && (
                          <button
                            title="Record Payment"
                            aria-label="Record Payment"
                            onClick={() => setActivePayment({ id: inv.id, num: inv.invoice_number, grand: Number(inv.grand_total), paid: Number(inv.amount_paid) })}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#111111] hover:bg-[#1A1A1A] border border-[#222222] text-[#CCCCCC] hover:text-white font-medium text-xs transition"
                          >
                            <CreditCard className="w-3 h-3 text-[#10B981]" />
                            <span>Record Payment</span>
                          </button>
                        )}
                        <a
                          title="Print Invoice"
                          aria-label="Print Invoice"
                          href={getInvoicePrintUrl(inv.id)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded hover:bg-[#1A1A1A] text-[#888888] hover:text-white transition"
                        >
                          <Printer className="w-3 h-3" />
                          <span>Print Invoice</span>
                        </a>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <RecordPaymentModal
        invoiceId={activePayment?.id ?? null}
        invoiceNumber={activePayment?.num ?? ''}
        grandTotal={activePayment?.grand ?? 0}
        amountPaid={activePayment?.paid ?? 0}
        onClose={() => setActivePayment(null)}
        onRefresh={() => { onRefresh(); setActivePayment(null); }}
        onError={onError}
        onSuccess={onSuccess}
      />
    </div>
  );
};
