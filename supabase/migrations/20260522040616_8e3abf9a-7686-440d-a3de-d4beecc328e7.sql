
DO $$
DECLARE
  v_actor uuid := '71d59645-b050-4f28-bd81-892a4fd4ee0f';
  v_nordic uuid;
  v_riverside uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM b2b.companies WHERE name = 'Nordic Hospitality Group') THEN
    INSERT INTO b2b.companies (name, domain, primary_contact_email, tier, seat_count, seats_used, license_status, license_expires_at, billing_status, notes)
    VALUES ('Nordic Hospitality Group', 'nordichospitality.eu', 'anna.berg@nordichospitality.eu', 'tier_2', 50, 42, 'active', now() + interval '8 months', 'current', 'Internal Training Digitalization customer.')
    RETURNING id INTO v_nordic;

    INSERT INTO b2b.audit_logs (actor_user_id, company_id, action, target_type)
    VALUES
      (v_actor, v_nordic, 'company_created', 'company'),
      (v_actor, v_nordic, 'license_renewed', 'company'),
      (v_actor, v_nordic, 'seats_increased', 'company');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM b2b.companies WHERE name = 'Riverside Consulting') THEN
    INSERT INTO b2b.companies (name, domain, primary_contact_email, tier, seat_count, seats_used, license_status, license_expires_at, billing_status, notes)
    VALUES ('Riverside Consulting', 'riversideconsulting.com', 'm.schmidt@riversideconsulting.com', 'tier_1', 25, 8, 'active', now() + interval '20 days', 'current', 'Employee Learning Benefit customer.')
    RETURNING id INTO v_riverside;

    INSERT INTO b2b.audit_logs (actor_user_id, company_id, action, target_type)
    VALUES
      (v_actor, v_riverside, 'company_created', 'company'),
      (v_actor, v_riverside, 'license_warning_sent', 'company');
  END IF;
END $$;
