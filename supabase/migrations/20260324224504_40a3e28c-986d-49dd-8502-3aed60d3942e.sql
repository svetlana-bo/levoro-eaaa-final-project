INSERT INTO site_pages (id, title, content) VALUES
  ('home', 'Home', ''),
  ('about', 'About Us', ''),
  ('faq', 'FAQ', ''),
  ('blog', 'Blog', ''),
  ('memberships', 'Memberships & Pricing', ''),
  ('business', 'Levoro for Business', ''),
  ('teach', 'Teach on Levoro', ''),
  ('contact', 'Contact Support', ''),
  ('partnerships', 'Partnerships', ''),
  ('courses', 'Browse Courses', ''),
  ('signup', 'Sign Up', '')
ON CONFLICT (id) DO NOTHING;