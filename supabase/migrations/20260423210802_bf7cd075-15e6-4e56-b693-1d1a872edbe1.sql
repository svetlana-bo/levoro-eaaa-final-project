-- Delete 4 leftover manual test rows from transactions
DELETE FROM public.transactions
WHERE id IN (
  '4d3bcb45-0000-0000-0000-000000000000',
  'ec9eedfd-0000-0000-0000-000000000000',
  'd5025d5c-0000-0000-0000-000000000000',
  '4006fe23-0000-0000-0000-000000000000'
);

-- Safer: delete by display_id (matches the 4 leftover test rows shown in admin UI)
DELETE FROM public.transactions WHERE display_id IN (1, 2, 3, 4);

-- Add Stripe linkage columns to transactions
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text,
  ADD COLUMN IF NOT EXISTS stripe_invoice_id text,
  ADD COLUMN IF NOT EXISTS stripe_customer_id text;

-- Idempotency key: same Stripe invoice can only be inserted once
CREATE UNIQUE INDEX IF NOT EXISTS transactions_stripe_invoice_id_key
  ON public.transactions (stripe_invoice_id)
  WHERE stripe_invoice_id IS NOT NULL;

-- Lookup index for subscription-related queries
CREATE INDEX IF NOT EXISTS transactions_stripe_subscription_id_idx
  ON public.transactions (stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;