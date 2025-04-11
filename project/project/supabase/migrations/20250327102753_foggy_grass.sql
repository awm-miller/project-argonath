/*
  # Update RLS policies for authentication

  1. Changes
    - Enable RLS on profiles table
    - Add policies for authenticated users
*/

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all profiles
CREATE POLICY "Allow authenticated users to read profiles"
ON profiles FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to insert profiles
CREATE POLICY "Allow authenticated users to insert profiles"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to update profiles
CREATE POLICY "Allow authenticated users to update profiles"
ON profiles FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);