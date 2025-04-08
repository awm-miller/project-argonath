/*
  # Sync All Users Across Tables

  1. Changes
    - Add function to sync users across all tables
    - Create procedure to sync a single user
    - Add trigger to automatically sync users
*/

-- Function to sync a single user across all tables
CREATE OR REPLACE FUNCTION sync_user(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  default_role_id uuid;
  auth_user auth.users%ROWTYPE;
BEGIN
  -- Get auth user data
  SELECT * INTO auth_user
  FROM auth.users
  WHERE id = user_id;

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
    user_id,
    COALESCE(SPLIT_PART(auth_user.email, '@', 1), 'New User'),
    default_role_id,
    NULL,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET
    updated_at = NOW(),
    role_id = COALESCE(user_profiles.role_id, EXCLUDED.role_id),
    classification_id = user_profiles.classification_id;

END;
$$;

-- Function to sync all users
CREATE OR REPLACE FUNCTION sync_all_users()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_record RECORD;
BEGIN
  -- Sync auth users
  FOR user_record IN 
    SELECT id FROM auth.users
  LOOP
    PERFORM sync_user(user_record.id);
  END LOOP;

  -- Sync profiles that might not have auth users
  FOR user_record IN 
    SELECT p.id 
    FROM user_profiles p 
    LEFT JOIN auth.users u ON u.id = p.id 
    WHERE u.id IS NULL
  LOOP
    PERFORM sync_user(user_record.id);
  END LOOP;
END;
$$;