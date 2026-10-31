import { useState, useEffect, useCallback } from 'react';
import { getProducts, getPlans } from '../api';
import { ProductWithVariants, Plan } from '../types';

export function useCatalogData(onError?: (error: string) => void) {
  const [products, setProducts] = useState<ProductWithVariants[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);

  const loadCatalog = useCallback(async () => {
    try {
      const [p, pl] = await Promise.all([getProducts(), getPlans()]);
      setProducts(p);
      setPlans(pl);
    } catch (err: unknown) {
      if (onError && err instanceof Error) onError(err.message);
    }
  }, [onError]);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  return { products, plans, loadCatalog, refresh: loadCatalog };
}
