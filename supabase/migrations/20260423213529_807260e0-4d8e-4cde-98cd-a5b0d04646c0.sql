ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_type_check;
ALTER TABLE public.transactions ADD CONSTRAINT transactions_type_check CHECK (type IN ('subscription', 'course_purchase', 'trial'));
UPDATE public.transactions SET type = 'trial' WHERE amount_paid = 0 AND stripe_invoice_id IS NOT NULL;