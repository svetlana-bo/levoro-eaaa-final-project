ALTER TABLE public.newsletter_subscribers
  ADD COLUMN IF NOT EXISTS unsubscribed_at timestamptz,
  ADD COLUMN IF NOT EXISTS unsubscribe_source text;