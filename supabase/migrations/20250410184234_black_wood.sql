/*
  # Add user profile fields

  1. Changes
    - Add first_name, last_name, and username columns to auth.users
    - Add unique constraint on username
    - Add trigger to ensure username contains no spaces
*/

-- Add new columns to auth.users
ALTER TABLE auth.users
ADD COLUMN IF NOT EXISTS first_name text,
ADD COLUMN IF NOT EXISTS last_name text,
ADD COLUMN IF NOT EXISTS username text;

-- Add unique constraint on username
ALTER TABLE auth.users
ADD CONSTRAINT users_username_key UNIQUE (username);

-- Create function to validate username
CREATE OR REPLACE FUNCTION public.validate_username()
RETURNS trigger AS $$
BEGIN
  IF NEW.username ~ '\s' THEN
    RAISE EXCEPTION 'Username cannot contain spaces';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to validate username before insert or update
DROP TRIGGER IF EXISTS validate_username_trigger ON auth.users;
CREATE TRIGGER validate_username_trigger
  BEFORE INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_username();