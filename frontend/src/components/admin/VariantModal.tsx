import React, { useState } from 'react';
import { X, Plus, Sparkles } from 'lucide-react';
import { createVariant } from '../../api';

interface VariantModalProps {
  productId: string | null;
  productName: string;
  onClose: () => void;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
  onRefresh: () => void;
}

export const VariantModal: React.FC<VariantModalProps> = ({
  productId,
  productName,
  onClose,
  onSuccess,
  onError,
  onRefresh,
}) => {
  const [attrName, setAttrName] = useState('Brand');
  const [attrVal, setAttrVal] = useState('Odoo');
  const [priceExtra, setPriceExtra] = useState(560);
  const [loading, setLoading] = useState(false);

  if (!productId) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await createVariant(productId, {
        attribute_name: attrName,
        attribute_value: attrVal,
        price_extra: Number(priceExtra),
      });
      onSuccess(`Added variant "${attrName}: ${attrVal} (+${priceExtra})" to ${productName}`);
      onRefresh();
      onClose();
    } catch (err: unknown) {
      onError(err instanceof Error ? err.message : 'Failed to add variant');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="bg-[#0A0A0A] rounded-xl max-w-sm w-full overflow-hidden border border-[#222222]">
        <div className="p-4 bg-[#000000] border-b border-[#222222] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-white" />
            <h3 className="font-semibold text-xs tracking-wider uppercase text-[#CCCCCC]">Add Dynamic Variant</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-[#1A1A1A] rounded text-[#888888] hover:text-white transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="text-xs text-[#888888]">Adding surcharge variant for: <strong className="text-[#EDEDED]">{productName}</strong></div>

          <div>
            <label className="block text-xs font-mono text-[#888888] mb-1">Attribute Name</label>
            <input
              type="text"
              value={attrName}
              onChange={(e) => setAttrName(e.target.value)}
              placeholder="e.g. Brand, Edition, Tier"
              required
              className="w-full text-xs bg-[#000000] border border-[#222222] focus:border-white rounded-md px-3 py-2 text-[#EDEDED] placeholder-[#555555] outline-none transition"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-[#888888] mb-1">Attribute Value</label>
            <input
              type="text"
              value={attrVal}
              onChange={(e) => setAttrVal(e.target.value)}
              placeholder="e.g. Odoo, Enterprise, Gold"
              required
              className="w-full text-xs bg-[#000000] border border-[#222222] focus:border-white rounded-md px-3 py-2 text-[#EDEDED] placeholder-[#555555] outline-none transition"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-[#888888] mb-1">Price Extra (Surcharge USD)</label>
            <input
              type="number"
              step="0.01"
              value={priceExtra}
              onChange={(e) => setPriceExtra(Number(e.target.value))}
              placeholder="560.00"
              required
              className="w-full text-xs font-mono bg-[#000000] border border-[#222222] focus:border-white rounded-md px-3 py-2 text-[#EDEDED] placeholder-[#555555] outline-none transition"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#161616]">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium bg-[#111111] hover:bg-[#1A1A1A] border border-[#222222] text-[#888888] hover:text-[#EDEDED] rounded-md transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !attrName || !attrVal}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-white hover:bg-[#EAEAEA] text-black rounded-md transition disabled:opacity-40"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{loading ? 'Adding...' : 'Attach Variant'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
