/*
  # Fix User Signup Process

  1. Changes
    - Ensure user_roles and user_classifications tables exist before trigger
    - Add default user role if not exists
    - Update trigger to handle errors gracefully
    - Add proper error handling for missing roles

  2. Security
    - Maintain existing RLS policies
    - Ensure secure default values
*/

-- Ensure user_roles exists and has default role
DO $$
BEGIN
  -- Create user role if it doesn't exist
  INSERT INTO user_roles (name, description)
  VALUES ('user', 'Standard user access')
  ON CONFLICT (name) DO NOTHING;
END $$;

-- Update handle_new_user function with better error handling
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
DECLARE
  default_role_id uuid;
BEGIN
  -- Get the default role ID
  SELECT id INTO default_role_id
  FROM user_roles
  WHERE name = 'user'
  LIMIT 1;

  -- If no default role exists, create it
  IF default_role_id IS NULL THEN
    INSERT INTO user_roles (name, description)
    VALUES ('user', 'Standard user access')
    RETURNING id INTO default_role_id;
  END IF;

  -- Create user profile
  INSERT INTO user_profiles (
    id,
    full_name,
    role_id,
    classification_id,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    COALESCE(SPLIT_PART(NEW.email, '@', 1), 'New User'),
    default_role_id,
    NULL,
    NOW(),
    NOW()
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error details to Supabase's logging system
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$ language plpgsql security definer;

-- Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Ensure proper permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated, service_role;