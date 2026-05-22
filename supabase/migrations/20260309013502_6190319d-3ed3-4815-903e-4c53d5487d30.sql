
CREATE TABLE public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_id serial NOT NULL,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('subscription', 'course_purchase')),
  course_id uuid REFERENCES public.courses(id) ON DELETE SET NULL,
  subscription_tier text CHECK (subscription_tier IN ('monthly', 'quarterly', 'yearly') OR subscription_tier IS NULL),
  amount_paid numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Students can view own transactions
CREATE POLICY "Students can view own transactions"
  ON public.transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can view all transactions
CREATE POLICY "Admins can view all transactions"
  ON public.transactions FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Admins can insert transactions
CREATE POLICY "Admins can insert transactions"
  ON public.transactions FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Users can insert own transactions (for payment flows)
CREATE POLICY "Users can insert own transactions"
  ON public.transactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
