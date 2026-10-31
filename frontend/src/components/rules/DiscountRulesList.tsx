import React from 'react';
import { DiscountRule } from '../../types';

interface DiscountRulesListProps {
  discountRules: DiscountRule[];
}

export const DiscountRulesList: React.FC<DiscountRulesListProps> = ({ discountRules }) => {
  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">
        Discount Matrix
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {discountRules.map((d) => (
          <div
            key={d.id}
            className="p-4 rounded-xl border border-slate-800 bg-slate-950/80 space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-sm">{d.name}</span>
              <span className="font-mono text-emerald-400 font-bold">
                {d.discount_type === 'percentage'
                  ? `${Number(d.value).toFixed(2)}%`
                  : `$${Number(d.value).toFixed(2)}`}
              </span>
            </div>
            <div className="text-xs text-slate-400 flex items-center justify-between">
              <span>Min Spend: ${Number(d.min_purchase_amount).toFixed(2)}</span>
              <span>Applies: {d.applies_to}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
