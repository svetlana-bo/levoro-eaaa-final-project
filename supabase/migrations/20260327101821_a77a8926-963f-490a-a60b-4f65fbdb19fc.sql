
-- Email settings (single-row config for admin email templates)
CREATE TABLE public.email_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_name text NOT NULL DEFAULT 'Levoro Academy',
  sender_email text NOT NULL DEFAULT 'noreply@levoro.academy',
  invite_subject text NOT NULL DEFAULT 'You''ve been invited to Levoro Academy',
  invite_heading text NOT NULL DEFAULT 'Welcome to Levoro Academy!',
  invite_body text NOT NULL DEFAULT '<p>You have been invited to join Levoro Academy. Click the button below to set up your password and get started.</p>',
  reset_subject text NOT NULL DEFAULT 'Reset Your Password',
  reset_heading text NOT NULL DEFAULT 'Password Reset Request',
  reset_body text NOT NULL DEFAULT '<p>We received a request to reset your password. Click the button below to create a new password.</p>',
  welcome_subject text NOT NULL DEFAULT 'Welcome to Levoro Academy!',
  welcome_heading text NOT NULL DEFAULT 'Welcome aboard!',
  welcome_body text NOT NULL DEFAULT '<p>Thank you for joining Levoro Academy. We''re excited to have you on board!</p>',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.email_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage email settings" ON public.email_settings FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Marketing email templates
CREATE TABLE public.marketing_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  subject text NOT NULL DEFAULT '',
  body text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.marketing_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage marketing emails" ON public.marketing_emails FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Email flows
CREATE TABLE public.email_flows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'New Flow',
  description text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.email_flows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage email flows" ON public.email_flows FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Email flow nodes
CREATE TABLE public.email_flow_nodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_id uuid NOT NULL REFERENCES public.email_flows(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'trigger',
  position_x integer NOT NULL DEFAULT 0,
  position_y integer NOT NULL DEFAULT 0,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.email_flow_nodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage email flow nodes" ON public.email_flow_nodes FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Email flow connections
CREATE TABLE public.email_flow_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_id uuid NOT NULL REFERENCES public.email_flows(id) ON DELETE CASCADE,
  source_node_id uuid NOT NULL REFERENCES public.email_flow_nodes(id) ON DELETE CASCADE,
  target_node_id uuid NOT NULL REFERENCES public.email_flow_nodes(id) ON DELETE CASCADE,
  label text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.email_flow_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage email flow connections" ON public.email_flow_connections FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Insert default email settings row
INSERT INTO public.email_settings (id) VALUES (gen_random_uuid());
