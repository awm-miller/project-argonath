/*
  # Sync Users System

  1. Changes
    - Add function to sync users from auth to profiles
    - Preserve existing role and classification data
    - Add function to get all users with their roles and classifications
*/

-- Function to sync a single user
CREATE OR REPLACE FUNCTION sync_user(auth_user auth.users)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  default_role_id uuid;
BEGIN
  -- Get default role ID
  SELECT id INTO default_role_id
  FROM user_roles
  WHERE name = 'user'
  LIMIT 1;

  -- Create default role if it doesn't exist
  IF default_role_id IS NULL THEN
    INSERT INTO user_roles (name, description)
    VALUES ('user', 'Standard user access')
    RETURNING id INTO default_role_id;
  END IF;

  -- Insert or update user profile
  INSERT INTO user_profiles (
    id,
    full_name,
    role_id,
    classification_id,
    created_at,
    updated_at
  )
  VALUES (
    auth_user.id,
    COALESCE(auth_user.raw_user_meta_data->>'full_name', SPLIT_PART(auth_user.email, '@', 1)),
    default_role_id,
    NULL,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET
    updated_at = NOW(),
    -- Only update role_id if it's NULL
    role_id = COALESCE(user_profiles.role_id, EXCLUDED.role_id),
    -- Preserve existing classification
    classification_id = user_profiles.classification_id;
END;
$$;

-- Function to sync all auth users
CREATE OR REPLACE FUNCTION sync_all_users()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  auth_user auth.users%ROWTYPE;
BEGIN
  FOR auth_user IN 
    SELECT * FROM auth.users
  LOOP
    PERFORM sync_user(auth_user);
  END LOOP;
END;
$$;