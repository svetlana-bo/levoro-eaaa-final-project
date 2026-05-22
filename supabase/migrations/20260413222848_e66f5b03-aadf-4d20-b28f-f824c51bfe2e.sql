ALTER TABLE public.blog_posts ADD COLUMN introduction text DEFAULT NULL;
ALTER TABLE public.blog_posts ADD COLUMN show_toc boolean NOT NULL DEFAULT false;