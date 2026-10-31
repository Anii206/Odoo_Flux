import React from 'react';
import { InvoiceWithLines } from '../../types';

interface InvoicesListProps {
  invoices: InvoiceWithLines[];
}

export const InvoicesList: React.FC<InvoicesListProps> = ({ invoices }) => {
  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">
        Invoices & Payment Records
      </h3>
      {invoices.length === 0 ? (
        <div className="text-center py-6 border border-slate-800/80 rounded-xl bg-slate-950/40 text-slate-500 text-xs">
          No invoices generated yet.
        </div>
      ) : (
        <div className="space-y-3">
          {invoices.map((inv) => (
            <div
              key={inv.invoice.id}
              className="p-4 rounded-xl border border-slate-800 bg-slate-950/80 flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white">{inv.invoice.invoice_number}</span>
                  <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                    {inv.invoice.status}
                  </span>
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  Period: {inv.invoice.billing_period_start} to {inv.invoice.billing_period_end} &bull; Due: {inv.invoice.due_date}
                </div>
              </div>
              <div className="text-right">
                <div className="text-base font-bold text-white font-mono">
                  ${Number(inv.invoice.grand_total).toFixed(2)}
                </div>
                <div className="text-xs text-slate-400">
                  Paid: ${Number(inv.invoice.amount_paid).toFixed(2)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
