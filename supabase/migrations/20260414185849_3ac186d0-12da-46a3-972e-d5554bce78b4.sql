
ALTER TABLE public.email_settings
  ADD COLUMN invite_header_config jsonb NOT NULL DEFAULT '{"bgColor":"#1a1a2e","bgImageUrl":"","textColor":"#ffffff","showHeader":true,"headerHeight":180}'::jsonb,
  ADD COLUMN invite_footer_config jsonb NOT NULL DEFAULT '{"bgColor":"#1a1a2e","textColor":"#ffffff","companyName":"Levoro Academy","contactEmail":"info@levoroacademy.com","socialLinks":[],"showFooter":true,"unsubscribeText":"","unsubscribeUrl":""}'::jsonb,
  ADD COLUMN invite_preheader text NOT NULL DEFAULT '',
  ADD COLUMN reset_header_config jsonb NOT NULL DEFAULT '{"bgColor":"#1a1a2e","bgImageUrl":"","textColor":"#ffffff","showHeader":true,"headerHeight":180}'::jsonb,
  ADD COLUMN reset_footer_config jsonb NOT NULL DEFAULT '{"bgColor":"#1a1a2e","textColor":"#ffffff","companyName":"Levoro Academy","contactEmail":"info@levoroacademy.com","socialLinks":[],"showFooter":true,"unsubscribeText":"","unsubscribeUrl":""}'::jsonb,
  ADD COLUMN reset_preheader text NOT NULL DEFAULT '',
  ADD COLUMN welcome_header_config jsonb NOT NULL DEFAULT '{"bgColor":"#1a1a2e","bgImageUrl":"","textColor":"#ffffff","showHeader":true,"headerHeight":180}'::jsonb,
  ADD COLUMN welcome_footer_config jsonb NOT NULL DEFAULT '{"bgColor":"#1a1a2e","textColor":"#ffffff","companyName":"Levoro Academy","contactEmail":"info@levoroacademy.com","socialLinks":[],"showFooter":true,"unsubscribeText":"","unsubscribeUrl":""}'::jsonb,
  ADD COLUMN welcome_preheader text NOT NULL DEFAULT '';
