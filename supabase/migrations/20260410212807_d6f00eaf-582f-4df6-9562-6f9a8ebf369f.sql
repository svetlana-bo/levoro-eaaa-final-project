
-- Create email_groups table
CREATE TABLE public.email_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_groups ENABLE ROW LEVEL SECURITY;

-- Admin-only access
CREATE POLICY "Admins can manage email groups"
ON public.email_groups
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add columns to marketing_emails
ALTER TABLE public.marketing_emails
ADD COLUMN preheader TEXT NOT NULL DEFAULT '',
ADD COLUMN header_text TEXT NOT NULL DEFAULT '',
ADD COLUMN group_id UUID REFERENCES public.email_groups(id) ON DELETE SET NULL;
