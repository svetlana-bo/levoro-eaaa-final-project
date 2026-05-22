
CREATE TABLE public.consent_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  consent_type TEXT NOT NULL,
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_country TEXT,
  method TEXT NOT NULL DEFAULT 'checkbox'
);

ALTER TABLE public.consent_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own consent logs"
  ON public.consent_log FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own consent logs"
  ON public.consent_log FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all consent logs"
  ON public.consent_log FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Allow anon insert for signup consent"
  ON public.consent_log FOR INSERT
  TO anon
  WITH CHECK (true);
