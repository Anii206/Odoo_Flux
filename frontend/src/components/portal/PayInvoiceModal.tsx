import React, { useState } from 'react';
import { X, CreditCard, CheckCircle, ShieldCheck } from 'lucide-react';
import { recordPayment } from '../../api';
import { Invoice } from '../../types';

interface PayInvoiceModalProps {
  isOpen: boolean;
  invoice: Invoice | null;
  onClose: () => void;
  onPaymentSuccess: () => void;
  onError: (msg: string) => void;
  onSuccess: (msg: string) => void;
}

export const PayInvoiceModal: React.FC<PayInvoiceModalProps> = ({
  isOpen,
  invoice,
  onClose,
  onPaymentSuccess,
  onError,
  onSuccess,
}) => {
  const [method, setMethod] = useState<'card' | 'upi' | 'bank_transfer'>('card');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !invoice) return null;

  const balance = Number(invoice.grand_total) - Number(invoice.amount_paid);

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await recordPayment(invoice.id, {
        payment_method: method,
        amount: balance,
        note: `Self-service online portal settlement (${method.toUpperCase()})`,
      });
      onSuccess(`Payment of $${balance.toFixed(2)} processed! Invoice ${invoice.invoice_number} is now Paid.`);
      onPaymentSuccess();
      onClose();
    } catch (err: unknown) {
      onError(err instanceof Error ? err.message : 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-100 font-sans">
      <div className="bg-[#0A0A0A] border border-[#222222] rounded-xl shadow-2xl max-w-sm w-full overflow-hidden text-[#EDEDED]">
        <div className="p-4 border-b border-[#222222] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-white" />
            <h3 className="font-bold text-sm tracking-tight text-white">Simulated Payment Gateway</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-[#1A1A1A] rounded text-[#888888] hover:text-white transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handlePay} className="p-5 space-y-4 text-xs font-mono">
          <div className="bg-[#111111] p-3 rounded-lg border border-[#222222] space-y-1 tabular-nums">
            <div className="flex justify-between text-[#888888]"><span>Invoice:</span> <strong className="text-white">{invoice.invoice_number}</strong></div>
            <div className="flex justify-between text-[#888888]"><span>Due Date:</span> <span>{invoice.due_date}</span></div>
            <div className="flex justify-between border-t border-[#222222] pt-1 font-bold text-white">
              <span>Total Balance Due:</span> <span className="text-[#10B981]">${balance.toFixed(2)}</span>
            </div>
          </div>

          <div>
            <label className="block text-[#888888] uppercase text-[10px] mb-1.5 font-sans">Select Payment Method</label>
            <div className="grid grid-cols-3 gap-2">
              {(['card', 'upi', 'bank_transfer'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMethod(m)}
                  className={`py-1.5 px-1 text-center font-bold rounded-md border uppercase text-[10px] transition ${
                    method === m ? 'bg-white text-black border-white shadow-xs' : 'bg-[#111111] text-[#888888] border-[#222222] hover:text-white'
                  }`}
                >
                  {m === 'bank_transfer' ? 'Wire' : m}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-amber-400 bg-amber-400/10 p-2 rounded-md border border-amber-400/20 font-sans">
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            <span>Simulated Gateway Checkout · Recorded as payment_source: customer_simulated (max ${balance.toFixed(2)})</span>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1A1A1A] font-sans">
            <button type="button" onClick={onClose} className="px-3 py-1.5 text-xs text-[#888888] hover:text-white hover:bg-[#1A1A1A] rounded-md transition">Cancel</button>
            <button type="submit" disabled={loading} className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold bg-white hover:bg-[#EAEAEA] text-black rounded-md transition disabled:opacity-50 shadow-xs">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>{loading ? 'Processing...' : `Pay $${balance.toFixed(2)}`}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
