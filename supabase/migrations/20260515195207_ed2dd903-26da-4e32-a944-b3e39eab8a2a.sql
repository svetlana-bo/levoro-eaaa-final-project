INSERT INTO public.knowledge_base_articles (title, content, sort_order, is_published, content_type, custom_key)
VALUES ('How to Market Your Course to Your Audience', '', 12, true, 'custom', 'market-your-course');

INSERT INTO public.site_images (image_key, value, alt_text)
VALUES ('kb-market-course-pdf', '/kb/how-to-market-your-course.pdf', 'How to Market Your Course to Your Audience')
ON CONFLICT (image_key) DO NOTHING;