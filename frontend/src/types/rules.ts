export interface TaxRule {
  id: string;
  name: string;
  rate_percentage: string | number;
  is_active: boolean;
  created_at: string;
}

export interface DiscountRule {
  id: string;
  name: string;
  discount_type: 'fixed' | 'percentage';
  value: string | number;
  min_purchase_amount: string | number;
  min_quantity: number;
  start_date: string;
  end_date: string | null;
  max_uses: number | null;
  current_uses: number;
  applies_to: 'all' | 'product';
  target_product_id: string | null;
  created_at: string;
}
