
-- Create marketing_email_sends table for exact send-level tracking
CREATE TABLE public.marketing_email_sends (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  flow_id UUID REFERENCES public.email_flows(id) ON DELETE SET NULL,
  flow_node_id UUID REFERENCES public.email_flow_nodes(id) ON DELETE SET NULL,
  template_id UUID REFERENCES public.marketing_emails(id) ON DELETE SET NULL,
  template_name TEXT NOT NULL DEFAULT '',
  recipient_email TEXT NOT NULL,
  recipient_user_id UUID,
  resend_message_id TEXT,
  status TEXT NOT NULL DEFAULT 'sent',
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  click_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.marketing_email_sends ENABLE ROW LEVEL SECURITY;

-- Admin access
CREATE POLICY "Admins can manage marketing email sends"
  ON public.marketing_email_sends FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Service role full access (for edge functions)
CREATE POLICY "Service role full access to marketing email sends"
  ON public.marketing_email_sends FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Index for webhook lookups by resend_message_id
CREATE INDEX idx_marketing_email_sends_resend_id ON public.marketing_email_sends(resend_message_id);

-- Index for flow evaluation lookups
CREATE INDEX idx_marketing_email_sends_flow_node_recipient ON public.marketing_email_sends(flow_id, flow_node_id, recipient_email);
