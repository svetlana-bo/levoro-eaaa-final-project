CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  meta_company_name text := NEW.raw_user_meta_data ->> 'company_name';
  meta_instructor_type text := NEW.raw_user_meta_data ->> 'instructor_type';
  resolved_first_name text;
  resolved_last_name text;
  resolved_instructor_type instructor_type;
BEGIN
  resolved_first_name := COALESCE(
    NEW.raw_user_meta_data ->> 'first_name',
    split_part(COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''), ' ', 1)
  );
  resolved_last_name := COALESCE(
    NEW.raw_user_meta_data ->> 'last_name',
    nullif(
      substring(
        COALESCE(NEW.raw_user_meta_data ->> 'full_name', '')
        from position(' ' in COALESCE(NEW.raw_user_meta_data ->> 'full_name', '')) + 1
      ),
      ''
    )
  );

  IF meta_instructor_type IS NOT NULL AND meta_instructor_type <> '' THEN
    BEGIN
      resolved_instructor_type := meta_instructor_type::instructor_type;
    EXCEPTION WHEN others THEN
      resolved_instructor_type := NULL;
    END;
  END IF;

  IF resolved_instructor_type = 'company' AND meta_company_name IS NOT NULL AND length(btrim(meta_company_name)) > 0 THEN
    resolved_first_name := NULL;
    resolved_last_name := NULL;
  END IF;

  INSERT INTO public.profiles (id, first_name, last_name, avatar_url, company_name, instructor_type)
  VALUES (
    NEW.id,
    resolved_first_name,
    resolved_last_name,
    COALESCE(
      NEW.raw_user_meta_data ->> 'avatar_url',
      NEW.raw_user_meta_data ->> 'picture'
    ),
    CASE WHEN resolved_instructor_type = 'company' THEN nullif(btrim(meta_company_name), '') ELSE NULL END,
    resolved_instructor_type
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'student');

  IF NEW.raw_user_meta_data ->> 'consent_method' IS NOT NULL THEN
    INSERT INTO public.consent_log (user_id, consent_type, ip_country, method)
    VALUES
      (NEW.id, 'terms_of_use', NEW.raw_user_meta_data ->> 'consent_country', NEW.raw_user_meta_data ->> 'consent_method'),
      (NEW.id, 'privacy_notice', NEW.raw_user_meta_data ->> 'consent_country', NEW.raw_user_meta_data ->> 'consent_method');
  END IF;

  RETURN NEW;
END;
$function$;