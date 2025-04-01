/*
  # Create users and assign access levels
  
  1. Changes
    - Create admin user if not exists
    - Create test users with different access levels
    - Assign appropriate classifications to users
*/

-- Create users and assign access levels
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
  
  -- Get or create admin user
  SELECT id INTO admin_id FROM auth.users WHERE email = 'admin@admin.com';
  
  IF admin_id IS NULL THEN
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
      'admin@admin.com',
      crypt('admin123', gen_salt('bf')),
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
    ) RETURNING id INTO admin_id;
  END IF;

  -- Get or create green user
  SELECT id INTO green_user_id FROM auth.users WHERE email = 'green.user@example.com';
  
  IF green_user_id IS NULL THEN
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
  END IF;

  -- Get or create yellow user
  SELECT id INTO yellow_user_id FROM auth.users WHERE email = 'yellow.user@example.com';
  
  IF yellow_user_id IS NULL THEN
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
  END IF;

  -- Get or create red user
  SELECT id INTO red_user_id FROM auth.users WHERE email = 'red.user@example.com';
  
  IF red_user_id IS NULL THEN
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
  END IF;

  -- Set access levels for each user if they don't exist
  INSERT INTO user_access_levels (user_id, classification_id, granted_by)
  VALUES
    (green_user_id, green_class_id, admin_id),
    (yellow_user_id, yellow_class_id, admin_id),
    (red_user_id, red_class_id, admin_id)
  ON CONFLICT (user_id, classification_id) DO NOTHING;

END $$;