/*
  # Add classification level to profiles

  1. Changes
    - Add classification_level column to profiles table
    - Update RLS policies to check user access level
*/

-- Add classification level to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS classification_level integer DEFAULT 1;

-- Update RLS policies
CREATE OR REPLACE FUNCTION user_has_access(profile_level integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM user_access_levels ual
    JOIN user_classifications uc ON uc.id = ual.classification_id
    WHERE ual.user_id = auth.uid()
    AND uc.level >= profile_level
  ) OR (
    SELECT email = 'admin@admin.com'
    FROM auth.users
    WHERE id = auth.uid()
  );
END;
$$;

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can read profiles" ON profiles;
DROP POLICY IF EXISTS "Allow authenticated users to read profiles" ON profiles;
DROP POLICY IF EXISTS "Allow authenticated users to insert profiles" ON profiles;
DROP POLICY IF EXISTS "Allow authenticated users to update profiles" ON profiles;

-- Create new policies
CREATE POLICY "Users can read profiles based on classification"
ON profiles FOR SELECT
TO authenticated
USING (user_has_access(classification_level));

CREATE POLICY "Admin can manage profiles"
ON profiles
TO authenticated
USING (auth.jwt() ->> 'email' = 'admin@admin.com')
WITH CHECK (auth.jwt() ->> 'email' = 'admin@admin.com');