
ALTER TABLE b2b.companies
  ADD COLUMN IF NOT EXISTS domain text,
  ADD COLUMN IF NOT EXISTS primary_contact_email text,
  ADD COLUMN IF NOT EXISTS notes text;
