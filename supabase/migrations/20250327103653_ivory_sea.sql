/*
  # Create admin user and role

  1. Changes
    - Create admin role
    - Create admin user
    - Update RLS policies for admin access
*/

-- Create admin user
DO $$
BEGIN
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  )
  VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'admin@admin.com',
    crypt('admin', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"role":"admin"}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  );
END $$;

-- Update RLS policies to give admin full access
DROP POLICY IF EXISTS "Allow admin full access" ON profiles;
CREATE POLICY "Allow admin full access"
ON profiles
TO authenticated
USING (
  auth.jwt() ->> 'email' = 'admin@admin.com'
)
WITH CHECK (
  auth.jwt() ->> 'email' = 'admin@admin.com'
);