
CREATE TABLE public.faq_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  answer text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.faq_items ENABLE ROW LEVEL SECURITY;

-- Anyone can view active FAQ items
CREATE POLICY "Anyone can view active faq items" ON public.faq_items
  FOR SELECT TO public USING (is_active = true);

-- Admins can do everything
CREATE POLICY "Admins can view all faq items" ON public.faq_items
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert faq items" ON public.faq_items
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update faq items" ON public.faq_items
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete faq items" ON public.faq_items
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Seed some FAQ items
INSERT INTO public.faq_items (question, answer, sort_order) VALUES
  ('What''s included in the membership?', 'Your Levoro membership gives you unlimited access to all courses on the platform, certificates of completion, downloadable workbooks and tools, and priority support. New courses are added regularly, and you get instant access to everything as soon as it''s published.', 1),
  ('Can I cancel anytime?', 'Yes, absolutely. You can cancel your subscription at any time from your account settings. There are no cancellation fees or long-term commitments. If you cancel, you''ll continue to have access until the end of your current billing period.', 2),
  ('Do I get certificates?', 'Yes! Upon completing any course, you receive a Certificate of Completion that you can download, share on LinkedIn, or add to your professional portfolio. Each certificate includes your name, the course title, and the date of completion.', 3),
  ('How often are new courses added?', 'We add new courses on a monthly basis. Our team works closely with expert instructors to ensure every course meets our quality standards and addresses real-world skills that professionals need.', 4),
  ('Is Levoro for beginners or professionals?', 'Levoro is designed for both. Our courses range from foundational topics to advanced professional development. Whether you''re just starting your career or looking to level up, you''ll find courses tailored to your stage of growth.', 5),
  ('How much time do I need?', 'Our courses are built around the principle of microlearning — short, focused lessons that fit into real life. Most lessons are 10-20 minutes long, so you can learn during a lunch break, commute, or quiet evening. There''s no rigid schedule.', 6),
  ('What makes Levoro different from other platforms?', 'Unlike traditional platforms that focus on volume, Levoro is built on adult learning science. We emphasize reflection, practical application, and real-world relevance. Our courses are curated, not crowdsourced, ensuring consistently high quality.', 7),
  ('Can I use Levoro for work or career growth?', 'Absolutely. Many of our members use Levoro to develop leadership skills, improve communication, build strategic thinking, and advance their careers. We also offer Levoro for Business for teams and organizations.', 8),
  ('Do I need to finish courses in order?', 'No. You can start any course at any time and complete lessons in whatever order works best for you. Each lesson is designed to be self-contained while building on a broader learning journey.', 9),
  ('Is this a one-time course purchase?', 'No, Levoro operates on a subscription model. With one monthly, quarterly, or annual membership, you get unlimited access to our entire course library. This means you''re never limited to just one course.', 10),
  ('What if I''m not sure yet?', 'We encourage you to browse our course catalog before subscribing. You can view course descriptions, curriculum outlines, and even preview select lessons for free. When you''re ready, you can join with confidence knowing you can cancel anytime.', 11);
