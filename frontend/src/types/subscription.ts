export type SubscriptionStatus =
  | 'draft'
  | 'quotation'
  | 'confirmed'
  | 'active'
  | 'paused'
  | 'closed';

export interface SubscriptionLine {
  id: string;
  subscription_id: string;
  product_id: string;
  variant_id: string | null;
  quantity: number;
  unit_price: string | number;
  tax_rate: string | number;
  line_total: string | number;
  created_at: string;
}

export interface SubscriptionWithLines {
  subscription: {
    id: string;
    sub_number: string;
    customer_id: string;
    plan_id: string;
    status: SubscriptionStatus;
    start_date: string;
    expiry_date: string | null;
    next_billing_date: string;
    payment_terms_days: number;
    applied_discount_id: string | null;
    created_at: string;
  };
  lines: SubscriptionLine[];
}
