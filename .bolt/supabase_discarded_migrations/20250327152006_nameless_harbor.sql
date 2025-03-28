/*
  # Fix user management system policies

  1. Changes
    - Drop existing policies before recreating them
    - Ensure clean policy creation
*/

-- Drop existing policies if they exist
DO $$ 
BEGIN
  -- Drop policies for user_classifications
  DROP POLICY IF EXISTS "Allow read access to user_classifications" ON user_classifications;
  DROP POLICY IF EXISTS "Allow admin full access to user_classifications" ON user_classifications;
  
  -- Drop policies for user_roles
  DROP POLICY IF EXISTS "Allow read access to user_roles" ON user_roles;
  DROP POLICY IF EXISTS "Allow admin full access to user_roles" ON user_roles;
  
  -- Drop policies for user_profiles
  DROP POLICY IF EXISTS "Allow users to view their own profile" ON user_profiles;
  DROP POLICY IF EXISTS "Allow users to update their own profile" ON user_profiles;
  DROP POLICY IF EXISTS "Allow admin full access to user_profiles" ON user_profiles;
END $$;

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_profiles up
    JOIN user_roles ur ON up.role_id = ur.id
    WHERE up.id = user_id
    AND ur.name = 'admin'
  );
$$;

-- Create function to get user's classification level
CREATE OR REPLACE FUNCTION get_user_classification_level(user_id uuid)
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT uc.level
  FROM user_profiles up
  JOIN user_classifications uc ON up.classification_id = uc.id
  WHERE up.id = user_id;
$$;

-- Recreate policies for user_classifications
CREATE POLICY "Allow read access to user_classifications"
  ON user_classifications FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow admin full access to user_classifications"
  ON user_classifications
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Recreate policies for user_roles
CREATE POLICY "Allow read access to user_roles"
  ON user_roles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow admin full access to user_roles"
  ON user_roles
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Recreate policies for user_profiles
CREATE POLICY "Allow users to view their own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid() OR is_admin(auth.uid()));

CREATE POLICY "Allow users to update their own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid() OR is_admin(auth.uid()))
  WITH CHECK (id = auth.uid() OR is_admin(auth.uid()));

CREATE POLICY "Allow admin full access to user_profiles"
  ON user_profiles
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));