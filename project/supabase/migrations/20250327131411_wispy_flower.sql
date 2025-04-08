/*
  # Add dummy users and set their access levels

  1. Changes
    - Add dummy users with different classification levels
    - Set up access levels for each user
    - Ensure admin has proper permissions
*/

-- Create dummy users
DO $$
DECLARE
  green_user_id uuid;
  yellow_user_id uuid;
  red_user_id uuid;
  green_class_id uuid;
  yellow_class_id uuid;
  red_class_id uuid;
  admin_id uuid;
BEGIN
  -- Get classification IDs
  SELECT id INTO green_class_id FROM user_classifications WHERE name = 'green';
  SELECT id INTO yellow_class_id FROM user_classifications WHERE name = 'yellow';
  SELECT id INTO red_class_id FROM user_classifications WHERE name = 'red';
  
  -- Get admin ID
  SELECT id INTO admin_id FROM auth.users WHERE email = 'admin@admin.com';

  -- Create users if they don't exist
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
  ) VALUES
  (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'green.user@example.com',
    crypt('password123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  ) RETURNING id INTO green_user_id;

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
  ) VALUES
  (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'yellow.user@example.com',
    crypt('password123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  ) RETURNING id INTO yellow_user_id;

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
  ) VALUES
  (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'red.user@example.com',
    crypt('password123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  ) RETURNING id INTO red_user_id;

  -- Set access levels for each user
  INSERT INTO user_access_levels (user_id, classification_id, granted_by)
  VALUES
    (green_user_id, green_class_id, admin_id),
    (yellow_user_id, yellow_class_id, admin_id),
    (red_user_id, red_class_id, admin_id);

END $$;