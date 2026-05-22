DROP INDEX IF EXISTS public.transactions_stripe_invoice_id_key;
CREATE UNIQUE INDEX transactions_stripe_invoice_id_key ON public.transactions (stripe_invoice_id);