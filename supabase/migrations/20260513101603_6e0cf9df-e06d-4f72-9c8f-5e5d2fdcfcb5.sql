ALTER TABLE public.email_settings
  ADD COLUMN IF NOT EXISTS verify_subject text DEFAULT 'Confirm your email',
  ADD COLUMN IF NOT EXISTS verify_heading text DEFAULT 'Confirm your email',
  ADD COLUMN IF NOT EXISTS verify_preheader text DEFAULT 'One quick step to activate your account',
  ADD COLUMN IF NOT EXISTS verify_body text DEFAULT '<p>Hi {{first_name}},</p><p>Thanks for signing up to Levoro Academy. Please confirm your email address to activate your account.</p>',
  ADD COLUMN IF NOT EXISTS verify_header_config jsonb DEFAULT '{"bgColor":"#1a1a2e","bgImageUrl":"","textColor":"#ffffff","showHeader":true,"headerHeight":180}'::jsonb,
  ADD COLUMN IF NOT EXISTS verify_footer_config jsonb DEFAULT '{"bgColor":"#1a1a2e","textColor":"#ffffff","companyName":"Levoro Academy","contactEmail":"info@levoroacademy.com","socialLinks":[],"showFooter":true}'::jsonb;