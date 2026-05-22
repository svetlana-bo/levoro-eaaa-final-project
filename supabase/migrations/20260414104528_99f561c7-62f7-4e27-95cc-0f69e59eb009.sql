ALTER TABLE public.knowledge_base_articles
  ADD COLUMN content_type text NOT NULL DEFAULT 'richtext',
  ADD COLUMN custom_key text;