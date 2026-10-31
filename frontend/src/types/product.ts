export interface ProductVariant {
  id: string;
  product_id: string;
  attribute_name: string;
  attribute_value: string;
  price_extra: string | number;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  product_type: 'software' | 'addon' | 'service';
  sales_price: string | number;
  cost_price: string | number;
  notes: string | null;
  created_at: string;
}

export interface ProductWithVariants {
  product: Product;
  variants: ProductVariant[];
}
