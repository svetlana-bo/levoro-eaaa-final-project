-- Categories
CREATE TABLE public.contact_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  color text NOT NULL DEFAULT '#c9a84c',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.contact_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage contact categories"
  ON public.contact_categories FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view contact categories"
  ON public.contact_categories FOR SELECT
  TO public
  USING (true);

-- Threads
CREATE TABLE public.contact_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES public.contact_categories(id) ON DELETE SET NULL,
  source_page text NOT NULL,
  sender_name text NOT NULL DEFAULT '',
  sender_email text NOT NULL,
  subject text NOT NULL DEFAULT '',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_read boolean NOT NULL DEFAULT false,
  is_archived boolean NOT NULL DEFAULT false,
  last_message_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.contact_threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage contact threads"
  ON public.contact_threads FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public can insert contact threads"
  ON public.contact_threads FOR INSERT
  TO public
  WITH CHECK (true);

CREATE INDEX idx_contact_threads_archived_last_msg
  ON public.contact_threads (is_archived, last_message_at DESC);
CREATE INDEX idx_contact_threads_category
  ON public.contact_threads (category_id);
CREATE INDEX idx_contact_threads_unread
  ON public.contact_threads (is_read) WHERE is_read = false AND is_archived = false;

-- Messages
CREATE TABLE public.contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.contact_threads(id) ON DELETE CASCADE,
  direction text NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  body text NOT NULL DEFAULT '',
  sender_email text NOT NULL DEFAULT '',
  sender_name text NOT NULL DEFAULT '',
  admin_user_id uuid,
  resend_message_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage contact messages"
  ON public.contact_messages FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public can insert contact messages"
  ON public.contact_messages FOR INSERT
  TO public
  WITH CHECK (true);

CREATE INDEX idx_contact_messages_thread_created
  ON public.contact_messages (thread_id, created_at);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_contact_threads_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_contact_threads_updated_at
  BEFORE UPDATE ON public.contact_threads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_contact_threads_updated_at();

-- Seed default category
INSERT INTO public.contact_categories (slug, name, color)
VALUES ('general', 'General', '#c9a84c');