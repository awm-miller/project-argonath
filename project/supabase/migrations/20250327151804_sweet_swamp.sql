/*
  # Authentication and User Management System

  1. New Tables
    - `user_classifications`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `description` (text)
      - `level` (integer)
      - `created_at` (timestamp)
    
    - `user_roles`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `description` (text)
      - `created_at` (timestamp)
    
    - `user_profiles`
      - `id` (uuid, references auth.users)
      - `full_name` (text)
      - `avatar_url` (text)
      - `role_id` (uuid, references user_roles)
      - `classification_id` (uuid, references user_classifications)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for admin access
    - Add policies for user access to their own data
*/

-- Create user_classifications table
CREATE TABLE IF NOT EXISTS user_classifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  level integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create user_roles table
CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name text,
  avatar_url text,
  role_id uuid REFERENCES user_roles ON DELETE SET NULL,
  classification_id uuid REFERENCES user_classifications ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_classifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Insert default classifications
INSERT INTO user_classifications (name, description, level)
VALUES 
  ('green', 'Basic clearance level', 1),
  ('yellow', 'Intermediate clearance level', 2),
  ('black', 'Top clearance level', 3)
ON CONFLICT (name) DO NOTHING;

-- Insert default roles
INSERT INTO user_roles (name, description)
VALUES 
  ('user', 'Standard user access'),
  ('admin', 'Administrative access')
ON CONFLICT (name) DO NOTHING;

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

-- Policies for user_classifications
CREATE POLICY "Allow read access to user_classifications"
  ON user_classifications FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow admin full access to user_classifications"
  ON user_classifications
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Policies for user_roles
CREATE POLICY "Allow read access to user_roles"
  ON user_roles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow admin full access to user_roles"
  ON user_roles
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Policies for user_profiles
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

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();