import React, { useState } from 'react';
import { X, FileText, CheckCircle } from 'lucide-react';
import { createFromTemplate, getUsers } from '../../api';
import { QuotationTemplateWithLines, User } from '../../types';

interface NewFromTemplateModalProps {
  isOpen: boolean;
  templates: QuotationTemplateWithLines[];
  users: User[];
  onClose: () => void;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
  onRefresh: () => void;
}

export const NewFromTemplateModal: React.FC<NewFromTemplateModalProps> = ({
  isOpen,
  templates,
  users,
  onClose,
  onSuccess,
  onError,
  onRefresh,
}) => {
  const [templateId, setTemplateId] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [loading, setLoading] = useState(false);
  const [internalUsers, setInternalUsers] = useState<User[]>(users);

  React.useEffect(() => {
    if (isOpen) {
      getUsers().then(setInternalUsers).catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const activeUsers = internalUsers.length > 0 ? internalUsers : users;
  const customers = activeUsers.filter((u) => u.role === 'customer');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await createFromTemplate({
        template_id: templateId,
        customer_id: customerId,
      });
      onSuccess(`Quotation ${res.subscription.sub_number} generated from template in 'quotation' status.`);
      onRefresh();
      onClose();
    } catch (err: unknown) {
      onError(err instanceof Error ? err.message : 'Failed to create quotation from template');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="bg-[#0A0A0A] rounded-xl max-w-md w-full overflow-hidden border border-[#222222]">
        <div className="p-4 bg-[#000000] border-b border-[#222222] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-white" />
            <h3 className="font-semibold text-xs tracking-wider uppercase text-[#CCCCCC]">New from Quotation Template</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-[#1A1A1A] rounded text-[#888888] hover:text-white transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-mono text-[#888888] mb-1">Select Quotation Template</label>
            <select
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              required
              className="w-full text-xs bg-[#000000] border border-[#222222] focus:border-white rounded-md px-3 py-2 text-[#EDEDED] outline-none transition"
            >
              <option value="">-- Choose Template --</option>
              {templates.map(({ template, lines }) => (
                <option key={template.id} value={template.id}>
                  {template.name} ({lines.length} lines, {template.validity_days} days validity)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono text-[#888888] mb-1">Select Customer Account</label>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              required
              className="w-full text-xs bg-[#000000] border border-[#222222] focus:border-white rounded-md px-3 py-2 text-[#EDEDED] outline-none transition"
            >
              <option value="">-- Choose Customer --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.email} (ID: {c.id.substring(0, 8)}...)
                </option>
              ))}
            </select>
          </div>

          <div className="text-xs text-[#888888] bg-[#000000] p-3 rounded-lg border border-[#222222] font-mono text-[11px]">
            Calculates base price + variant surcharges, verifies plan min seats, and initializes in status <span className="text-[#0070F3] font-semibold">quotation</span>.
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#161616]">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium bg-[#111111] hover:bg-[#1A1A1A] border border-[#222222] text-[#888888] hover:text-[#EDEDED] rounded-md transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !templateId || !customerId}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-white hover:bg-[#EAEAEA] text-black rounded-md transition disabled:opacity-40"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>{loading ? 'Creating...' : 'Generate Quotation'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
