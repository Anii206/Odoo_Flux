import React, { useState } from 'react';
import { X, CreditCard, CheckCircle } from 'lucide-react';
import { recordPayment } from '../../api';

interface RecordPaymentModalProps {
  invoiceId: string | null;
  invoiceNumber: string;
  grandTotal: number;
  amountPaid: number;
  onClose: () => void;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
  onRefresh: () => void;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  invoiceId,
  invoiceNumber,
  grandTotal,
  amountPaid,
  onClose,
  onSuccess,
  onError,
  onRefresh,
}) => {
  const balanceDue = Math.max(0, grandTotal - amountPaid);
  const [method, setMethod] = useState<'bank_transfer' | 'card' | 'upi' | 'cash'>('bank_transfer');
  const [amount, setAmount] = useState<number>(balanceDue);
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (invoiceId) {
      setAmount(Math.max(0, grandTotal - amountPaid));
      setMethod('bank_transfer');
      setNote('');
    }
  }, [invoiceId, grandTotal, amountPaid]);

  if (!invoiceId) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await recordPayment(invoiceId, {
        payment_method: method,
        amount: Number(amount),
        payment_date: paymentDate || undefined,
        note: note || undefined,
      });
      onSuccess(`Payment of $${amount} recorded for ${invoiceNumber}. Status is now "${res.invoice.status}".`);
      onRefresh();
      onClose();
    } catch (err: unknown) {
      onError(err instanceof Error ? err.message : 'Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-100">
      <div className="bg-[#0A0A0A] border border-[#222222] rounded-xl shadow-2xl max-w-sm w-full overflow-hidden text-[#EDEDED] font-sans">
        <div className="p-4 border-b border-[#222222] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-[#EDEDED]" />
            <h3 className="font-bold text-sm tracking-tight text-white">Record Invoice Payment</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-[#1A1A1A] rounded text-[#888888] hover:text-white transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs font-mono">
          <div className="bg-[#111111] p-3 rounded-lg border border-[#222222] space-y-1 tabular-nums">
            <div className="flex justify-between text-[#888888]"><span>Invoice:</span> <strong className="text-white">{invoiceNumber}</strong></div>
            <div className="flex justify-between text-[#888888]"><span>Grand / Paid:</span> <span>${grandTotal} / ${amountPaid}</span></div>
            <div className="flex justify-between text-[#10B981] font-bold border-t border-[#222222] pt-1">
              <span>Balance Due:</span> <span>${balanceDue.toFixed(2)}</span>
            </div>
          </div>

          <div>
            <label className="block text-[#888888] uppercase text-[10px] mb-1 font-sans">Payment Method</label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as any)}
              className="w-full text-xs border border-[#222222] rounded-md px-3 py-1.5 bg-[#111111] text-[#EDEDED] focus:border-white focus:outline-none transition"
            >
              <option value="bank_transfer">Bank Wire Transfer</option>
              <option value="card">Credit / Debit Card</option>
              <option value="upi">UPI / Instant Transfer</option>
              <option value="cash">Cash / Cheque</option>
            </select>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1 font-sans">
              <label className="text-[#888888] uppercase text-[10px]">Payment Amount ($ USD)</label>
              <span className="text-[10px] text-neutral-400 font-mono">Max: ${balanceDue.toFixed(2)}</span>
            </div>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              required
              min={0.01}
              max={balanceDue}
              className="w-full text-xs border border-[#222222] rounded-md px-3 py-1.5 bg-[#111111] text-white focus:border-white focus:outline-none transition tabular-nums"
            />
            <p className="text-[10px] text-[#777777] mt-1 font-sans">
              Payment source will be logged as <span className="font-semibold text-white font-mono">staff_manual</span>.
            </p>
          </div>

          <div>
            <label className="block text-[#888888] uppercase text-[10px] mb-1 font-sans">Payment Date</label>
            <input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              required
              className="w-full text-xs border border-[#222222] rounded-md px-3 py-1.5 bg-[#111111] text-[#EDEDED] focus:border-white focus:outline-none transition font-mono"
            />
          </div>

          <div>
            <label className="block text-[#888888] uppercase text-[10px] mb-1 font-sans">Optional Reference / Note</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Wire confirmation #98124"
              className="w-full text-xs border border-[#222222] rounded-md px-3 py-1.5 bg-[#111111] text-[#EDEDED] placeholder-[#555555] focus:border-white focus:outline-none transition font-sans"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#1A1A1A] font-sans">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-[#888888] hover:text-white hover:bg-[#1A1A1A] rounded-md transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || amount <= 0}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold bg-white hover:bg-[#EAEAEA] text-black rounded-md transition disabled:opacity-50"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>{loading ? 'Recording...' : 'Apply Payment'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
