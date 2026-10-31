import React from 'react';
import { ProductWithVariants } from '../../types';

interface ProductsListProps {
  products: ProductWithVariants[];
}

export const ProductsList: React.FC<ProductsListProps> = ({ products }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {products.map((p) => (
        <div
          key={p.product.id}
          className="p-5 rounded-xl border border-slate-800 bg-slate-950/70 space-y-3"
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs uppercase font-semibold tracking-wider text-indigo-400">
                {p.product.product_type}
              </span>
              <h4 className="text-base font-bold text-white">{p.product.name}</h4>
              <p className="text-xs text-slate-400">{p.product.notes || 'No description'}</p>
            </div>
            <div className="text-right font-mono">
              <div className="text-lg font-bold text-emerald-400">
                ${Number(p.product.sales_price).toFixed(2)}
              </div>
              <div className="text-[11px] text-slate-500">
                Cost: ${Number(p.product.cost_price).toFixed(2)}
              </div>
            </div>
          </div>

          {/* Variants */}
          {p.variants.length > 0 && (
            <div className="pt-2 border-t border-slate-800/80">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">
                Configurable Variants:
              </span>
              <div className="mt-1 space-y-1">
                {p.variants.map((v) => (
                  <div
                    key={v.id}
                    className="text-xs flex items-center justify-between bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-800 text-slate-300"
                  >
                    <span>
                      {v.attribute_name}: <strong className="text-white">{v.attribute_value}</strong>
                    </span>
                    <span className="font-mono text-indigo-300">
                      +${Number(v.price_extra).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
