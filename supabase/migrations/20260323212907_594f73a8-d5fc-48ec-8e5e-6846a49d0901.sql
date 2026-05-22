
-- Currency prices table for admin-set fixed prices per plan per currency
CREATE TABLE public.currency_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id TEXT NOT NULL,
  currency_code TEXT NOT NULL,
  price NUMERIC NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(plan_id, currency_code)
);

-- RLS policies for currency_prices
ALTER TABLE public.currency_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view currency prices"
  ON public.currency_prices FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admins can insert currency prices"
  ON public.currency_prices FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update currency prices"
  ON public.currency_prices FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete currency prices"
  ON public.currency_prices FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Add currency tracking columns to transactions
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS currency_code TEXT DEFAULT 'EUR',
  ADD COLUMN IF NOT EXISTS exchange_rate_eur NUMERIC DEFAULT 1.0,
  ADD COLUMN IF NOT EXISTS amount_eur NUMERIC;
