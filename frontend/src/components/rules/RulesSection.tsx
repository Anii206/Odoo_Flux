import React from 'react';
import { Layers } from 'lucide-react';
import { TaxRule, DiscountRule, QuotationTemplateWithLines } from '../../types';
import { TaxRulesList } from './TaxRulesList';
import { DiscountRulesList } from './DiscountRulesList';
import { QuotationTemplatesList } from './QuotationTemplatesList';

interface RulesSectionProps {
  taxRules: TaxRule[];
  discountRules: DiscountRule[];
  templates: QuotationTemplateWithLines[];
}

export const RulesSection: React.FC<RulesSectionProps> = ({
  taxRules,
  discountRules,
  templates,
}) => {
  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-400" />
            Tax Rules, Discount Rules & Quotation Templates
          </h2>
          <p className="text-xs text-slate-400">
            Global fiscal configurations and automated subscription quotation presets.
          </p>
        </div>

        {/* Tax Rules */}
        <TaxRulesList taxRules={taxRules} />

        {/* Discount Rules */}
        <DiscountRulesList discountRules={discountRules} />

        {/* Quotation Templates */}
        <QuotationTemplatesList templates={templates} />
      </div>
    </div>
  );
};
