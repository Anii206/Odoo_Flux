import React from 'react';
import { Mail, DollarSign, AlertCircle } from 'lucide-react';
import { Invoice, User } from '../../types';
import { VercelStatusPill } from '../common/VercelStatusPill';

interface OverdueChaseTableProps {
  invoices: Invoice[];
  users: User[];
  onSendReminder: (id: string, invNum: string) => void;
  onRecordPayment: (invoice: Invoice) => void;
  loadingReminderId: string | null;
}

export const OverdueChaseTable: React.FC<OverdueChaseTableProps> = ({
  invoices,
  users,
  onSendReminder,
  onRecordPayment,
  loadingReminderId,
}) => {
  const getCustomerEmail = (customerId: string) => {
    return users.find((u) => u.id === customerId)?.email || 'Customer';
  };

  const getDaysPastDue = (dueDate: string) => {
    const due = new Date(dueDate).getTime();
    const now = new Date().getTime();
    return Math.max(Math.floor((now - due) / (1000 * 60 * 60 * 24)), 1);
  };

  return (
    <div className="bg-[#0A0A0A] border border-[#222222] rounded-lg overflow-hidden font-sans text-[#EDEDED]">
      <div className="p-4 border-b border-[#1A1A1A] flex items-center justify-between">
        <div>
          <h3 className="font-bold text-sm tracking-tight text-white flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-[#EE0000]" />
            <span>Overdue Invoices Chase Table ({invoices.length})</span>
          </h3>
          <p className="text-xs font-mono text-[#888888] mt-0.5">Automated delinquency chase & zero-latency payment recording</p>
        </div>
      </div>

      <div className="overflow-x-auto max-h-96">
        <table className="w-full text-left text-xs font-mono tabular-nums">
          <thead className="sticky top-0 backdrop-blur-md bg-black/80 z-10 border-b border-[#222222] text-[#888888] uppercase text-[10px] tracking-wider">
            <tr className="h-9">
              <th className="px-4">Invoice #</th>
              <th className="px-4">Customer</th>
              <th className="px-4">Due Date</th>
              <th className="px-4">Overdue Days</th>
              <th className="px-4">Balance Owed</th>
              <th className="px-4 text-right">Chase Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1A1A1A]">
            {invoices.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-[#555555] font-sans">
                  Zero overdue receivables. All accounts current and active!
                </td>
              </tr>
            ) : (
              invoices.map((inv) => {
                const daysOverdue = getDaysPastDue(inv.due_date);
                const balance = Number(inv.grand_total) - Number(inv.amount_paid);
                const isReminding = loadingReminderId === inv.id;

                return (
                  <tr key={inv.id} className="h-10 hover:bg-[#111111] transition-colors">
                    <td className="px-4 font-bold text-white">{inv.invoice_number}</td>
                    <td className="px-4 text-[#AAAAAA]">{getCustomerEmail(inv.customer_id)}</td>
                    <td className="px-4 text-[#888888]">{inv.due_date}</td>
                    <td className="px-4">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        daysOverdue > 30 ? 'bg-[#EE0000]/15 text-[#EE0000] border border-[#EE0000]/30' : 'bg-[#F5A623]/15 text-[#F5A623] border border-[#F5A623]/30'
                      }`}>
                        +{daysOverdue}d overdue
                      </span>
                    </td>
                    <td className="px-4 font-bold text-white">${balance.toFixed(2)}</td>
                    <td className="px-4 text-right space-x-2">
                      <button
                        onClick={() => onSendReminder(inv.id, inv.invoice_number)}
                        disabled={isReminding}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#111111] hover:bg-[#1A1A1A] border border-[#222222] text-[#CCCCCC] hover:text-white font-sans text-xs transition disabled:opacity-50"
                      >
                        <Mail className="w-3 h-3" />
                        <span>{isReminding ? 'Sending...' : 'Remind'}</span>
                      </button>
                      <button
                        onClick={() => onRecordPayment(inv)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white hover:bg-[#EAEAEA] text-black font-sans font-bold text-xs transition shadow-xs"
                      >
                        <DollarSign className="w-3 h-3" />
                        <span>Record Pay</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
