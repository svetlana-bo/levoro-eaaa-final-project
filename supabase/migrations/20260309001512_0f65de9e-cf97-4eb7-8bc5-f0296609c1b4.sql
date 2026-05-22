-- Add display_id to profiles table
ALTER TABLE public.profiles 
ADD COLUMN display_id INTEGER GENERATED ALWAYS AS IDENTITY;

-- Add display_id to courses table
ALTER TABLE public.courses 
ADD COLUMN display_id INTEGER GENERATED ALWAYS AS IDENTITY;