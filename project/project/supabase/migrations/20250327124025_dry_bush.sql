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

-- Create user_roles table
CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Create user_classifications table
CREATE TABLE IF NOT EXISTS user_classifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  level integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create user_access_levels table
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

-- Policies for user_roles
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

-- Policies for user_classifications
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

-- Policies for user_access_levels
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

-- Insert default roles
INSERT INTO user_roles (name, description)
VALUES 
  ('admin', 'Full system access'),
  ('user', 'Standard user access')
ON CONFLICT (name) DO NOTHING;

-- Create function to check if user is admin
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