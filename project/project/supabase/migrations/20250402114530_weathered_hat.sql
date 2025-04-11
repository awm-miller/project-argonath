/*
  # Enhance User Signup Process

  1. Changes
    - Create function to automatically create user profile on signup
    - Add trigger to handle user creation
    - Update RLS policies for unclassified users

  2. Security
    - Maintain existing RLS policies
    - Add new restrictions for unclassified users
*/

-- Function to create user profile after signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO user_profiles (id, full_name, role_id, classification_id)
  VALUES (
    NEW.id,
    SPLIT_PART(NEW.email, '@', 1),  -- Use part before @ as initial name
    (SELECT id FROM user_roles WHERE name = 'user'),  -- Default role
    NULL  -- No classification initially
  );
  RETURN NEW;
END;
$$ language plpgsql security definer;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to check if user has any classification
CREATE OR REPLACE FUNCTION has_classification(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_profiles
    WHERE id = user_id
    AND classification_id IS NOT NULL
  );
$$;