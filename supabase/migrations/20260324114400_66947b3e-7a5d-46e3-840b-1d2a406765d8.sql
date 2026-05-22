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
  RETURN NEW;
END;
$$;