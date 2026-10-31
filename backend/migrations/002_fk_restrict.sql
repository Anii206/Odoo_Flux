-- Migration 002: Change invoices and payments foreign keys from CASCADE to RESTRICT to preserve audit trails

-- 1. Invoices -> Subscriptions: Change from ON DELETE CASCADE to ON DELETE RESTRICT
ALTER TABLE invoices
    DROP CONSTRAINT IF EXISTS invoices_subscription_id_fkey,
    ADD CONSTRAINT invoices_subscription_id_fkey
        FOREIGN KEY (subscription_id)
        REFERENCES subscriptions(id)
        ON DELETE RESTRICT;

-- 2. Payments -> Invoices: Change from ON DELETE CASCADE to ON DELETE RESTRICT
ALTER TABLE payments
    DROP CONSTRAINT IF EXISTS payments_invoice_id_fkey,
    ADD CONSTRAINT payments_invoice_id_fkey
        FOREIGN KEY (invoice_id)
        REFERENCES invoices(id)
        ON DELETE RESTRICT;
