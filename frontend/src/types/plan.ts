export interface Plan {
  id: string;
  name: string;
  billing_interval: 'daily' | 'weekly' | 'monthly' | 'yearly';
  plan_price: string | number;
  min_quantity: number;
  available_from: string;
  available_to: string | null;
  auto_close: boolean;
  allow_early_close: boolean;
  allow_pause: boolean;
  allow_renew: boolean;
  created_at: string;
}
