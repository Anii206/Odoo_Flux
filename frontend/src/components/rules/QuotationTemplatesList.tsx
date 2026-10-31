import React from 'react';
import { QuotationTemplateWithLines } from '../../types';

interface QuotationTemplatesListProps {
  templates: QuotationTemplateWithLines[];
}

export const QuotationTemplatesList: React.FC<QuotationTemplatesListProps> = ({ templates }) => {
  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">
        Quotation Templates
      </h3>
      <div className="space-y-3">
        {templates.map((qt) => (
          <div
            key={qt.template.id}
            className="p-4 rounded-xl border border-slate-800 bg-slate-950/80 flex items-center justify-between"
          >
            <div>
              <h4 className="font-bold text-white text-sm">{qt.template.name}</h4>
              <div className="text-xs text-slate-400">
                Validity: {qt.template.validity_days} days &bull; Includes {qt.lines.length} preset lines
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
