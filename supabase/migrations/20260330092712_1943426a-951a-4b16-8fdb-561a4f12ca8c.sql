
-- Create email_flow_runs table to track flow execution state per recipient
CREATE TABLE public.email_flow_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  flow_id UUID NOT NULL REFERENCES public.email_flows(id) ON DELETE CASCADE,
  flow_node_id UUID NOT NULL REFERENCES public.email_flow_nodes(id) ON DELETE CASCADE,
  recipient_email TEXT NOT NULL,
  resend_message_id TEXT,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('sent', 'waiting', 'completed', 'failed')),
  wait_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS: admin-only access
ALTER TABLE public.email_flow_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage email flow runs"
  ON public.email_flow_runs
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Service role needs access too (for the evaluator cron function)
CREATE POLICY "Service role full access to email flow runs"
  ON public.email_flow_runs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Index for the evaluator query
CREATE INDEX idx_email_flow_runs_waiting ON public.email_flow_runs (status, wait_until) WHERE status = 'waiting';
CREATE INDEX idx_email_flow_runs_flow ON public.email_flow_runs (flow_id, recipient_email);

-- Enable pg_net extension for cron HTTP calls
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
