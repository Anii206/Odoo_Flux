import React from 'react';
import { Package } from 'lucide-react';
import { ProductWithVariants, Plan } from '../../types';
import { ProductsList } from './ProductsList';
import { PlansList } from './PlansList';

interface CatalogSectionProps {
  products: ProductWithVariants[];
  plans: Plan[];
}

export const CatalogSection: React.FC<CatalogSectionProps> = ({ products, plans }) => {
  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Package className="w-5 h-5 text-indigo-400" />
              Product Variants & Subscription Plans
            </h2>
            <p className="text-xs text-slate-400">
              Software, addons, services, variant matrices (e.g., Brand = Odoo +$560.00), and billing cycles.
            </p>
          </div>
        </div>

        {/* Products & Variants Grid */}
        <ProductsList products={products} />

        {/* Plans Grid */}
        <PlansList plans={plans} />
      </div>
    </div>
  );
};
