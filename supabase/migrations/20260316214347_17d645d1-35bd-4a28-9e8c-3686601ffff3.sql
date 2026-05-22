ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS preview_video_url text;
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS content_blocks jsonb DEFAULT '[]'::jsonb;