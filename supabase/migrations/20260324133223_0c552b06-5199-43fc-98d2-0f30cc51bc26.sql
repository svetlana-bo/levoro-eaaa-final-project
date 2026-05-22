-- Remove the vulnerable anon insert policy
DROP POLICY IF EXISTS "Allow anon insert for signup consent" ON public.consent_log;

-- Update handle_new_user to also log consent from user metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data ->> 'first_name',
      split_part(COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''), ' ', 1)
    ),
    COALESCE(
      NEW.raw_user_meta_data ->> 'last_name',
      nullif(
        substring(
          COALESCE(NEW.raw_user_meta_data ->> 'full_name', '')
          from position(' ' in COALESCE(NEW.raw_user_meta_data ->> 'full_name', '')) + 1
        ),
        ''
      )
    ),
    COALESCE(
      NEW.raw_user_meta_data ->> 'avatar_url',
      NEW.raw_user_meta_data ->> 'picture'
    )
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'student');

  -- Log consent if metadata is present (from email signup)
  IF NEW.raw_user_meta_data ->> 'consent_method' IS NOT NULL THEN
    INSERT INTO public.consent_log (user_id, consent_type, ip_country, method)
    VALUES
      (NEW.id, 'terms_of_use', NEW.raw_user_meta_data ->> 'consent_country', NEW.raw_user_meta_data ->> 'consent_method'),
      (NEW.id, 'privacy_notice', NEW.raw_user_meta_data ->> 'consent_country', NEW.raw_user_meta_data ->> 'consent_method');
  END IF;

  RETURN NEW;
END;
$$;