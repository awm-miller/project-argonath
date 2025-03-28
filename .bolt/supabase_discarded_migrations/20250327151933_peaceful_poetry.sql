/*
  # Create Initial Users

  1. Changes
    - Create admin user (alex@counterextremism.org.uk)
    - Create test users for green and yellow clearances
    - Set up their profiles with appropriate roles and classifications
*/

-- Create users and set up their profiles
DO $$
DECLARE
  admin_role_id uuid;
  user_role_id uuid;
  green_class_id uuid;
  yellow_class_id uuid;
  black_class_id uuid;
  admin_user_id uuid;
  green_user_id uuid;
  yellow_user_id uuid;
BEGIN
  -- Get role and classification IDs
  SELECT id INTO admin_role_id FROM user_roles WHERE name = 'admin';
  SELECT id INTO user_role_id FROM user_roles WHERE name = 'user';
  SELECT id INTO green_class_id FROM user_classifications WHERE name = 'green';
  SELECT id INTO yellow_class_id FROM user_classifications WHERE name = 'yellow';
  SELECT id INTO black_class_id FROM user_classifications WHERE name = 'black';

  -- Create admin user
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
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'alex@counterextremism.org.uk',
    crypt('password1', gen_salt('bf')),
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
  ) RETURNING id INTO admin_user_id;

  -- Create green user
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
  ) VALUES (
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

  -- Create yellow user
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
  ) VALUES (
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

  -- Create user profiles
  INSERT INTO user_profiles (id, full_name, role_id, classification_id)
  VALUES
    (admin_user_id, 'Alex Admin', admin_role_id, black_class_id),
    (green_user_id, 'Green User', user_role_id, green_class_id),
    (yellow_user_id, 'Yellow User', user_role_id, yellow_class_id);

END $$;