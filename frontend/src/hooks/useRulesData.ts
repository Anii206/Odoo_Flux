import { useState, useEffect, useCallback } from 'react';
import { getTaxRules, getDiscountRules, getQuotationTemplates } from '../api';
import { TaxRule, DiscountRule, QuotationTemplateWithLines } from '../types';

export function useRulesData(onError?: (error: string) => void) {
  const [taxRules, setTaxRules] = useState<TaxRule[]>([]);
  const [discountRules, setDiscountRules] = useState<DiscountRule[]>([]);
  const [templates, setTemplates] = useState<QuotationTemplateWithLines[]>([]);

  const loadRules = useCallback(async () => {
    try {
      const [t, d, q] = await Promise.all([
        getTaxRules(),
        getDiscountRules(),
        getQuotationTemplates(),
      ]);
      setTaxRules(t);
      setDiscountRules(d);
      setTemplates(q);
    } catch (err: unknown) {
      if (onError && err instanceof Error) onError(err.message);
    }
  }, [onError]);

  useEffect(() => {
    loadRules();
  }, [loadRules]);

  return {
    taxRules,
    discountRules,
    templates,
    quotationTemplates: templates,
    loadRules,
    refresh: loadRules,
  };
}
