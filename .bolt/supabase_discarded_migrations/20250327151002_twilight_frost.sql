/*
  # Add user classification for alex@counterextremism.org

  1. Changes
    - Create admin user if not exists
    - Add classification for alex@counterextremism.org
    - Set up access level for the user
*/

-- Create admin user if not exists
DO $$
DECLARE
  admin_id uuid;
  black_class_id uuid;
  alex_id uuid;
BEGIN
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
    ) VALUES (
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

  -- Create alex@counterextremism.org user if not exists
  SELECT id INTO alex_id FROM auth.users WHERE email = 'alex@counterextremism.org';
  
  IF alex_id IS NULL THEN
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
      'alex@counterextremism.org',
      crypt('Password123!', gen_salt('bf')),
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
    ) RETURNING id INTO alex_id;
  END IF;

  -- Get black classification ID
  SELECT id INTO black_class_id FROM user_classifications WHERE name = 'black';

  -- Set access level for alex@counterextremism.org
  INSERT INTO user_access_levels (user_id, classification_id, granted_by)
  VALUES (alex_id, black_class_id, admin_id)
  ON CONFLICT (user_id, classification_id) DO NOTHING;

END $$;