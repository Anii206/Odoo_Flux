import React, { useState } from 'react';
import { Trash2, Plus, FileText } from 'lucide-react';
import {
  createTaxRule,
  deleteTaxRule,
  createDiscountRule,
  deleteDiscountRule,
  createQuotationTemplate,
  deleteQuotationTemplate,
} from '../../api';
import { TaxRule, DiscountRule, QuotationTemplateWithLines, Plan, ProductWithVariants } from '../../types';

interface RulesManagerProps {
  taxRules: TaxRule[];
  discountRules: DiscountRule[];
  templates?: QuotationTemplateWithLines[];
  plans?: Plan[];
  products?: ProductWithVariants[];
  onRefresh: () => void;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

export const RulesManager: React.FC<RulesManagerProps> = ({
  taxRules,
  discountRules,
  templates = [],
  plans = [],
  products = [],
  onRefresh,
  onSuccess,
  onError,
}) => {
  const [tab, setTab] = useState<'discounts' | 'taxes' | 'templates'>('discounts');

  // Discount rule state
  const [dName, setDName] = useState('');
  const [dType, setDType] = useState<'fixed' | 'percentage'>('percentage');
  const [dValue, setDValue] = useState(10);
  const [dMinAmount, setDMinAmount] = useState(0);
  const [dMinQty, setDMinQty] = useState(5);
  const [dMaxUses, setDMaxUses] = useState(1);

  // Tax rule state
  const [tName, setTName] = useState('');
  const [tRate, setTRate] = useState(18);

  // Quotation Template state
  const [qtName, setQtName] = useState('');
  const [qtPlanId, setQtPlanId] = useState('');
  const [qtValidityDays, setQtValidityDays] = useState(30);
  const [qtProductId, setQtProductId] = useState('');
  const [qtVariantId, setQtVariantId] = useState('');
  const [qtQuantity, setQtQuantity] = useState(5);

  const handleCreateDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createDiscountRule({
        name: dName,
        discount_type: dType,
        value: Number(dValue),
        min_purchase_amount: Number(dMinAmount),
        min_quantity: Number(dMinQty),
        max_uses: Number(dMaxUses),
        start_date: new Date().toISOString().split('T')[0],
        applies_to: 'all',
      });
      onSuccess(`Discount "${dName}" created.`);
      setDName('');
      onRefresh();
    } catch (err: unknown) {
      onError(err instanceof Error ? err.message : 'Failed to create discount');
    }
  };

  const handleCreateTax = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createTaxRule({ name: tName, rate_percentage: Number(tRate), is_active: true });
      onSuccess(`Tax rule "${tName}" created.`);
      setTName('');
      onRefresh();
    } catch (err: unknown) {
      onError(err instanceof Error ? err.message : 'Failed to create tax rule');
    }
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qtPlanId || !qtProductId) {
      onError('Plan and Product must be selected.');
      return;
    }
    try {
      await createQuotationTemplate({
        name: qtName,
        plan_id: qtPlanId,
        validity_days: Number(qtValidityDays),
        lines: [
          {
            product_id: qtProductId,
            variant_id: qtVariantId || undefined,
            quantity: Number(qtQuantity),
          },
        ],
      });
      onSuccess(`Quotation Template "${qtName}" created successfully.`);
      setQtName('');
      onRefresh();
    } catch (err: unknown) {
      onError(err instanceof Error ? err.message : 'Failed to create quotation template');
    }
  };

  const selectedProduct = products.find((p) => p.product.id === qtProductId);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 border-b border-[#222222] pb-3">
        <button
          onClick={() => setTab('discounts')}
          className={`px-3 py-1.5 text-xs font-mono font-medium rounded-md transition ${tab === 'discounts' ? 'bg-white text-black font-bold' : 'bg-[#111111] text-[#888888] hover:text-[#EDEDED] border border-[#222222]'}`}
        >
          Discount Rules ({discountRules.length})
        </button>
        <button
          onClick={() => setTab('taxes')}
          className={`px-3 py-1.5 text-xs font-mono font-medium rounded-md transition ${tab === 'taxes' ? 'bg-white text-black font-bold' : 'bg-[#111111] text-[#888888] hover:text-[#EDEDED] border border-[#222222]'}`}
        >
          Tax Rules ({taxRules.length})
        </button>
        <button
          onClick={() => setTab('templates')}
          className={`px-3 py-1.5 text-xs font-mono font-medium rounded-md transition ${tab === 'templates' ? 'bg-white text-black font-bold' : 'bg-[#111111] text-[#888888] hover:text-[#EDEDED] border border-[#222222]'}`}
        >
          Quotation Templates ({templates.length})
        </button>
      </div>

      {tab === 'discounts' && (
        <div className="space-y-4">
          <form onSubmit={handleCreateDiscount} className="bg-[#0A0A0A] border border-[#222222] rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-7 gap-3">
            <input
              type="text"
              placeholder="Promo Name"
              value={dName}
              onChange={(e) => setDName(e.target.value)}
              required
              className="text-xs bg-[#000000] border border-[#222222] focus:border-white rounded-md px-3 py-2 text-[#EDEDED] md:col-span-2 outline-none"
            />
            <select
              value={dType}
              onChange={(e) => setDType(e.target.value as any)}
              className="text-xs bg-[#000000] border border-[#222222] focus:border-white rounded-md px-3 py-2 text-[#EDEDED] outline-none"
            >
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed ($)</option>
            </select>
            <input
              type="number"
              step="0.01"
              placeholder="Value (%)"
              value={dValue}
              onChange={(e) => setDValue(Number(e.target.value))}
              required
              className="text-xs font-mono bg-[#000000] border border-[#222222] focus:border-white rounded-md px-3 py-2 text-[#EDEDED] outline-none"
            />
            <input
              type="number"
              placeholder="Min Seats (Qty)"
              value={dMinQty}
              onChange={(e) => setDMinQty(Number(e.target.value))}
              className="text-xs font-mono bg-[#000000] border border-[#222222] focus:border-white rounded-md px-3 py-2 text-[#EDEDED] outline-none"
            />
            <input
              type="number"
              placeholder="Max Uses"
              value={dMaxUses}
              onChange={(e) => setDMaxUses(Number(e.target.value))}
              className="text-xs font-mono bg-[#000000] border border-[#222222] focus:border-white rounded-md px-3 py-2 text-[#EDEDED] outline-none"
            />
            <button
              type="submit"
              disabled={!dName}
              className="bg-white hover:bg-[#EAEAEA] text-black text-xs font-semibold rounded-md px-4 py-2 disabled:opacity-40 transition"
            >
              Create Discount
            </button>
          </form>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {discountRules.map((d) => (
              <div key={d.id} className="bg-[#0A0A0A] border border-[#222222] rounded-xl p-3.5 flex items-center justify-between hover:border-[#333333] transition">
                <div>
                  <div className="font-semibold text-xs text-[#EDEDED]">{d.name}</div>
                  <div className="text-[11px] text-[#888888] font-mono mt-0.5">
                    <span className="text-[#0070F3]">{d.discount_type === 'percentage' ? `${d.value}% Off` : `$${d.value} Flat`}</span> &bull; Uses: <span className="tabular-nums">{d.current_uses}/{d.max_uses ?? '∞'}</span> &bull; Min Qty: <span className="tabular-nums">{d.min_quantity}</span>
                  </div>
                </div>
                <button onClick={async () => { await deleteDiscountRule(d.id); onRefresh(); }} className="text-[#666666] hover:text-[#EE0000] p-1 transition">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'taxes' && (
        <div className="space-y-4">
          <form onSubmit={handleCreateTax} className="bg-[#0A0A0A] border border-[#222222] rounded-xl p-4 flex flex-wrap gap-3">
            <input
              type="text"
              placeholder="Tax Name (e.g. GST 18%, VAT)"
              value={tName}
              onChange={(e) => setTName(e.target.value)}
              required
              className="text-xs bg-[#000000] border border-[#222222] focus:border-white rounded-md px-3 py-2 text-[#EDEDED] flex-1 outline-none"
            />
            <input
              type="number"
              step="0.01"
              placeholder="Rate (%)"
              value={tRate}
              onChange={(e) => setTRate(Number(e.target.value))}
              required
              className="text-xs font-mono bg-[#000000] border border-[#222222] focus:border-white rounded-md px-3 py-2 text-[#EDEDED] w-32 outline-none"
            />
            <button
              type="submit"
              disabled={!tName}
              className="bg-white hover:bg-[#EAEAEA] text-black text-xs font-semibold rounded-md px-4 py-2 disabled:opacity-40 transition"
            >
              Create Tax Rule
            </button>
          </form>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {taxRules.map((t) => (
              <div key={t.id} className="bg-[#0A0A0A] border border-[#222222] rounded-xl p-3.5 flex items-center justify-between hover:border-[#333333] transition">
                <div>
                  <div className="font-semibold text-xs text-[#EDEDED]">{t.name}</div>
                  <div className="text-[11px] font-mono text-[#888888] mt-0.5"><span className="text-[#10B981] tabular-nums">{t.rate_percentage}% Rate</span> &bull; {t.is_active ? 'Active' : 'Inactive'}</div>
                </div>
                <button onClick={async () => { await deleteTaxRule(t.id); onRefresh(); }} className="text-[#666666] hover:text-[#EE0000] p-1 transition">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'templates' && (
        <div className="space-y-4">
          <form onSubmit={handleCreateTemplate} className="bg-[#0A0A0A] border border-[#222222] rounded-xl p-4 space-y-3">
            <h4 className="text-xs font-semibold font-mono text-[#888888] uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-white" />
              <span>Configure Quotation Template</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                placeholder="Template Name (e.g. Plan A Quotation)"
                value={qtName}
                onChange={(e) => setQtName(e.target.value)}
                required
                className="text-xs bg-[#000000] border border-[#222222] focus:border-white rounded-md px-3 py-2 text-[#EDEDED] outline-none"
              />
              <select
                value={qtPlanId}
                onChange={(e) => setQtPlanId(e.target.value)}
                required
                className="text-xs bg-[#000000] border border-[#222222] focus:border-white rounded-md px-3 py-2 text-[#EDEDED] outline-none"
              >
                <option value="">-- Select Linked Plan --</option>
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} (${p.plan_price}/{p.billing_interval})</option>
                ))}
              </select>
              <input
                type="number"
                placeholder="Validity Days"
                value={qtValidityDays}
                onChange={(e) => setQtValidityDays(Number(e.target.value))}
                required
                min={1}
                className="text-xs font-mono bg-[#000000] border border-[#222222] focus:border-white rounded-md px-3 py-2 text-[#EDEDED] outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-[#161616]">
              <select
                value={qtProductId}
                onChange={(e) => {
                  setQtProductId(e.target.value);
                  setQtVariantId('');
                }}
                required
                className="text-xs bg-[#000000] border border-[#222222] focus:border-white rounded-md px-3 py-2 text-[#EDEDED] outline-none"
              >
                <option value="">-- Select Product --</option>
                {products.map(({ product }) => (
                  <option key={product.id} value={product.id}>{product.name} (${product.sales_price})</option>
                ))}
              </select>

              <select
                value={qtVariantId}
                onChange={(e) => setQtVariantId(e.target.value)}
                className="text-xs bg-[#000000] border border-[#222222] focus:border-white rounded-md px-3 py-2 text-[#EDEDED] outline-none"
              >
                <option value="">-- Base (No Variant) --</option>
                {selectedProduct?.variants.map((v) => (
                  <option key={v.id} value={v.id}>{v.attribute_name}: {v.attribute_value} (+${v.price_extra})</option>
                ))}
              </select>

              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Quantity"
                  value={qtQuantity}
                  onChange={(e) => setQtQuantity(Number(e.target.value))}
                  required
                  min={1}
                  className="w-24 text-xs font-mono bg-[#000000] border border-[#222222] focus:border-white rounded-md px-3 py-2 text-[#EDEDED] outline-none"
                />
                <button
                  type="submit"
                  disabled={!qtName || !qtPlanId || !qtProductId}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-white hover:bg-[#EAEAEA] text-black text-xs font-semibold rounded-md px-4 py-2 disabled:opacity-40 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Quotation Template</span>
                </button>
              </div>
            </div>
          </form>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {templates.map(({ template, lines }) => {
              const plan = plans.find((p) => p.id === template.plan_id);
              return (
                <div key={template.id} className="bg-[#0A0A0A] border border-[#222222] rounded-xl p-3.5 flex items-center justify-between hover:border-[#333333] transition">
                  <div>
                    <div className="font-semibold text-xs text-[#EDEDED]">{template.name}</div>
                    <div className="text-[11px] text-[#888888] font-mono mt-0.5">
                      <span className="text-[#0070F3]">{plan?.name ?? 'Plan'}</span> &bull; Validity: <span className="tabular-nums">{template.validity_days} days</span> &bull; {lines.length} Line(s)
                    </div>
                  </div>
                  <button onClick={async () => { await deleteQuotationTemplate(template.id); onRefresh(); }} className="text-[#666666] hover:text-[#EE0000] p-1 transition">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
