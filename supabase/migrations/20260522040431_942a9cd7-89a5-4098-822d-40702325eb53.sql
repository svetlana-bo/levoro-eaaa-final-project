
DROP VIEW IF EXISTS public.v_b2b_companies;
CREATE VIEW public.v_b2b_companies AS
SELECT
  c.id,
  c.name,
  c.domain,
  c.primary_contact_email,
  c.notes,
  c.tier::text AS tier,
  c.seat_count,
  c.seats_used,
  c.license_status::text AS license_status,
  c.license_expires_at,
  c.billing_status::text AS billing_status,
  c.created_at
FROM b2b.companies c;
