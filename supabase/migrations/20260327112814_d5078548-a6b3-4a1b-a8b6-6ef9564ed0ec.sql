
-- Add recipient columns to email_flows
ALTER TABLE public.email_flows ADD COLUMN IF NOT EXISTS recipient_type TEXT NOT NULL DEFAULT 'all';
ALTER TABLE public.email_flows ADD COLUMN IF NOT EXISTS recipient_data JSONB NOT NULL DEFAULT '[]'::jsonb;

-- Create email_events table for analytics
CREATE TABLE public.email_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email_type TEXT NOT NULL DEFAULT 'marketing',
  template_id UUID,
  template_name TEXT NOT NULL DEFAULT '',
  recipient_email TEXT NOT NULL DEFAULT '',
  event_type TEXT NOT NULL DEFAULT 'sent',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.email_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage email events" ON public.email_events
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create saved_queries table for SQL Studio
CREATE TABLE public.saved_queries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL DEFAULT 'Untitled Query',
  sql_query TEXT NOT NULL DEFAULT '',
  visualization_config JSONB DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.saved_queries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage saved queries" ON public.saved_queries
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
