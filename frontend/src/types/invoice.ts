export type InvoiceStatus = 'draft' | 'confirmed' | 'paid' | 'cancelled';

export interface InvoiceLine {
  id: string;
  invoice_id: string;
  product_id: string;
  variant_id: string | null;
  quantity: number;
  unit_price: string | number;
  tax_rate: string | number;
  line_total: string | number;
  created_at: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  subscription_id: string;
  customer_id: string;
  billing_period_start: string;
  billing_period_end: string;
  status: InvoiceStatus;
  subtotal: string | number;
  discount_amount: string | number;
  tax_amount: string | number;
  grand_total: string | number;
  amount_paid: string | number;
  due_date: string;
  created_at: string;
}

export interface InvoiceWithLines {
  invoice: Invoice;
  lines: InvoiceLine[];
}

export interface Payment {
  id: string;
  invoice_id: string;
  payment_method: 'bank_transfer' | 'card' | 'upi' | 'cash';
  amount: string | number;
  payment_date: string;
  note: string | null;
  payment_source?: 'customer_simulated' | 'staff_manual';
  created_at: string;
}
