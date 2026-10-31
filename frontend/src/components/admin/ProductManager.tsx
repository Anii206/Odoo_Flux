import React, { useState } from 'react';
import { Package, Plus, Trash2, Tag } from 'lucide-react';
import { createProduct, deleteProduct, deleteVariant } from '../../api';
import { ProductWithVariants } from '../../types';
import { VariantModal } from './VariantModal';

interface ProductManagerProps {
  products: ProductWithVariants[];
  onRefresh: () => void;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

export const ProductManager: React.FC<ProductManagerProps> = ({
  products,
  onRefresh,
  onSuccess,
  onError,
}) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<'software' | 'addon' | 'service'>('software');
  const [salesPrice, setSalesPrice] = useState(1200);
  const [costPrice, setCostPrice] = useState(300);
  const [notes, setNotes] = useState('');
  const [activeVariant, setActiveVariant] = useState<{ id: string; name: string } | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createProduct({
        name,
        product_type: type,
        sales_price: Number(salesPrice),
        cost_price: Number(costPrice),
        notes: notes || undefined,
      });
      onSuccess(`Created product "${name}"`);
      setName('');
      setNotes('');
      onRefresh();
    } catch (err: unknown) {
      onError(err instanceof Error ? err.message : 'Failed to create product');
    }
  };

  const handleDelete = async (id: string, pName: string) => {
    if (!confirm(`Delete product "${pName}"?`)) return;
    try {
      await deleteProduct(id);
      onSuccess(`Deleted product "${pName}"`);
      onRefresh();
    } catch (err: unknown) {
      onError(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#0A0A0A] border border-[#222222] rounded-xl p-5">
        <h3 className="font-semibold text-xs tracking-wider uppercase text-[#888888] flex items-center gap-2 mb-4">
          <Package className="w-3.5 h-3.5 text-white" />
          <span>Add New Catalog Product</span>
        </h3>
        <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3">
          <input
            type="text" placeholder="Product Name" value={name} onChange={(e) => setName(e.target.value)} required
            className="text-xs bg-[#000000] border border-[#222222] focus:border-white rounded-md px-3 py-2 text-[#EDEDED] placeholder-[#555555] outline-none transition"
          />
          <select
            value={type} onChange={(e) => setType(e.target.value as 'software' | 'addon' | 'service')}
            className="text-xs bg-[#000000] border border-[#222222] focus:border-white rounded-md px-3 py-2 text-[#EDEDED] outline-none transition"
          >
            <option value="software">Software</option>
            <option value="addon">Add-on</option>
            <option value="service">Service</option>
          </select>
          <input
            type="number" step="0.01" placeholder="Sales Price" value={salesPrice} onChange={(e) => setSalesPrice(Number(e.target.value))} required
            className="text-xs font-mono bg-[#000000] border border-[#222222] focus:border-white rounded-md px-3 py-2 text-[#EDEDED] placeholder-[#555555] outline-none transition"
          />
          <input
            type="number" step="0.01" placeholder="Cost Price" value={costPrice} onChange={(e) => setCostPrice(Number(e.target.value))} required
            className="text-xs font-mono bg-[#000000] border border-[#222222] focus:border-white rounded-md px-3 py-2 text-[#EDEDED] placeholder-[#555555] outline-none transition"
          />
          <input
            type="text" placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)}
            className="text-xs bg-[#000000] border border-[#222222] focus:border-white rounded-md px-3 py-2 text-[#EDEDED] placeholder-[#555555] outline-none transition"
          />
          <button type="submit" disabled={!name} className="flex items-center justify-center gap-1.5 bg-white hover:bg-[#EAEAEA] text-black text-xs font-semibold rounded-md px-4 py-2 transition disabled:opacity-40">
            <Plus className="w-3.5 h-3.5" />
            <span>Create</span>
          </button>
        </form>
      </div>

      <div className="bg-[#0A0A0A] border border-[#222222] rounded-xl overflow-hidden">
        <div className="p-4 bg-[#000000]/60 border-b border-[#222222] font-mono text-xs text-[#888888] uppercase tracking-wider flex items-center justify-between">
          <span>Products & Surcharge Variants</span>
          <span className="text-[#EDEDED] font-mono">{products.length} Items</span>
        </div>
        <div className="divide-y divide-[#1A1A1A]">
          {products.map(({ product, variants }) => (
            <div key={product.id} data-testid="product-card" data-product-name={product.name} className="p-4 hover:bg-[#111111]/50 transition">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-[#EDEDED]">{product.name}</span>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-[#111111] border border-[#222222] text-[#888888]">{product.product_type}</span>
                  </div>
                  <div className="text-xs text-[#888888] font-mono mt-1">
                    Sales: <strong className="text-white font-mono tabular-nums">${product.sales_price}</strong> &bull; Cost: <span className="font-mono tabular-nums">${product.cost_price}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setActiveVariant({ id: product.id, name: product.name })} className="flex items-center gap-1 text-xs font-medium text-[#EDEDED] hover:text-white bg-[#111111] hover:bg-[#1A1A1A] border border-[#222222] px-2.5 py-1.5 rounded-md transition">
                    <Plus className="w-3 h-3" />
                    <span>Add Variant</span>
                  </button>
                  <button onClick={() => handleDelete(product.id, product.name)} className="p-1.5 text-[#666666] hover:text-[#EE0000] rounded-md hover:bg-[#1A1A1A] transition">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              {variants.length > 0 && (
                <div className="mt-2.5 flex flex-wrap gap-2 pt-2 border-t border-[#161616]">
                  {variants.map((v) => (
                    <span key={v.id} className="inline-flex items-center gap-1.5 bg-[#111111] border border-[#222222] text-[#CCCCCC] text-xs px-2.5 py-1 rounded-full font-mono">
                      <Tag className="w-3 h-3 text-[#0070F3]" />
                      <span>{v.attribute_name}: <strong className="text-white">{v.attribute_value}</strong> (<span className="text-[#10B981] tabular-nums">+{v.price_extra}</span>)</span>
                      <button onClick={async () => { await deleteVariant(product.id, v.id); onRefresh(); }} className="text-[#666666] hover:text-[#EE0000] ml-1">&times;</button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <VariantModal
        productId={activeVariant?.id || null} productName={activeVariant?.name || ''}
        onClose={() => setActiveVariant(null)} onSuccess={onSuccess} onError={onError} onRefresh={onRefresh}
      />
    </div>
  );
};
