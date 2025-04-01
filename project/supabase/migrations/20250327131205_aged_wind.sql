/*
  # User Management System

  1. New Tables
    - `user_roles`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `description` (text)
      - `created_at` (timestamp)
    
    - `user_classifications`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `description` (text)
      - `level` (integer)
      - `created_at` (timestamp)
    
    - `user_access_levels`
      - `user_id` (uuid, references auth.users)
      - `classification_id` (uuid, references user_classifications)
      - `granted_by` (uuid, references auth.users)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for admin access
    - Add policies for user access to their own data
*/

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Allow admin full access to roles" ON user_roles;
  DROP POLICY IF EXISTS "Allow users to view roles" ON user_roles;
  DROP POLICY IF EXISTS "Allow admin full access to classifications" ON user_classifications;
  DROP POLICY IF EXISTS "Allow users to view classifications" ON user_classifications;
  DROP POLICY IF EXISTS "Allow admin full access to access levels" ON user_access_levels;
  DROP POLICY IF EXISTS "Allow users to view their own access levels" ON user_access_levels;
EXCEPTION
  WHEN undefined_table THEN
    NULL;
END $$;

-- Create user_roles table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Create user_classifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_classifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  level integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create user_access_levels table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_access_levels (
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  classification_id uuid REFERENCES user_classifications(id) ON DELETE CASCADE,
  granted_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, classification_id)
);

-- Enable RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_classifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_access_levels ENABLE ROW LEVEL SECURITY;

-- Create new policies
CREATE POLICY "Allow admin full access to roles"
ON user_roles
TO authenticated
USING (
  auth.jwt() ->> 'email' = 'admin@admin.com'
)
WITH CHECK (
  auth.jwt() ->> 'email' = 'admin@admin.com'
);

CREATE POLICY "Allow users to view roles"
ON user_roles
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow admin full access to classifications"
ON user_classifications
TO authenticated
USING (
  auth.jwt() ->> 'email' = 'admin@admin.com'
)
WITH CHECK (
  auth.jwt() ->> 'email' = 'admin@admin.com'
);

CREATE POLICY "Allow users to view classifications"
ON user_classifications
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow admin full access to access levels"
ON user_access_levels
TO authenticated
USING (
  auth.jwt() ->> 'email' = 'admin@admin.com'
)
WITH CHECK (
  auth.jwt() ->> 'email' = 'admin@admin.com'
);

CREATE POLICY "Allow users to view their own access levels"
ON user_access_levels
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
);

-- Insert default roles if they don't exist
INSERT INTO user_roles (name, description)
VALUES 
  ('admin', 'Full system access'),
  ('user', 'Standard user access')
ON CONFLICT (name) DO NOTHING;

-- Insert default classifications if they don't exist
INSERT INTO user_classifications (name, description, level)
VALUES 
  ('green', 'Basic access level', 1),
  ('yellow', 'Intermediate access level', 2),
  ('red', 'High access level', 3)
ON CONFLICT (name) DO NOTHING;

-- Create or replace admin check function
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM auth.users
    WHERE id = auth.uid()
    AND email = 'admin@admin.com'
  );
$$;