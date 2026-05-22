
ALTER TABLE public.marketing_emails
  ADD COLUMN IF NOT EXISTS header_config jsonb NOT NULL DEFAULT '{"bgColor":"#1a1a2e","bgImageUrl":"","textColor":"#ffffff","showHeader":true}'::jsonb,
  ADD COLUMN IF NOT EXISTS footer_config jsonb NOT NULL DEFAULT '{"bgColor":"#1a1a2e","textColor":"#ffffff","companyName":"Levoro Academy","contactEmail":"info@levoroacademy.com","socialLinks":[],"showFooter":true}'::jsonb,
  ADD COLUMN IF NOT EXISTS buttons jsonb NOT NULL DEFAULT '[]'::jsonb;
