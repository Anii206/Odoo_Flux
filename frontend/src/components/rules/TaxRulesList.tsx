import React from 'react';
import { TaxRule } from '../../types';

interface TaxRulesListProps {
  taxRules: TaxRule[];
}

export const TaxRulesList: React.FC<TaxRulesListProps> = ({ taxRules }) => {
  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">
        Configured Tax Rules
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {taxRules.map((t) => (
          <div
            key={t.id}
            className="p-4 rounded-xl border border-slate-800 bg-slate-950/80 flex items-center justify-between"
          >
            <div>
              <div className="font-bold text-slate-200 text-sm">{t.name}</div>
              <span className="text-[11px] text-emerald-400">Active</span>
            </div>
            <div className="text-lg font-bold font-mono text-white">
              {Number(t.rate_percentage).toFixed(2)}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
