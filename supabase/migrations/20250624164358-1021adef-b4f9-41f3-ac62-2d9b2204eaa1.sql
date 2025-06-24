
-- Create admin user in auth.users and corresponding users table record
DO $$
DECLARE
  admin_auth_id UUID;
BEGIN
  -- First, try to create the auth user (this will fail if user already exists)
  BEGIN
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      confirmation_sent_at,
      confirmation_token,
      recovery_token,
      email_change_token_new,
      email_change,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      last_sign_in_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'ainematthew30@gmail.com',
      crypt('eddybrandon', gen_salt('bf')),
      now(),
      now(),
      '',
      '',
      '',
      '',
      now(),
      now(),
      '{"provider": "email", "providers": ["email"]}',
      '{"role": "admin"}',
      false,
      now()
    ) RETURNING id INTO admin_auth_id;
    
    -- Create corresponding record in public.users table
    INSERT INTO public.users (
      auth_id,
      email,
      role,
      status,
      profile_completed
    ) VALUES (
      admin_auth_id,
      'ainematthew30@gmail.com',
      'admin',
      'active',
      true
    );
    
    -- Create user profile
    INSERT INTO public.user_profiles (
      user_id,
      profile_type,
      profile_data
    ) VALUES (
      (SELECT id FROM public.users WHERE auth_id = admin_auth_id),
      'admin',
      jsonb_build_object(
        'name', 'Admin User',
        'location', 'System'
      )
    );
    
    RAISE NOTICE 'Admin user created successfully';
    
  EXCEPTION
    WHEN unique_violation THEN
      -- User already exists, just ensure they have admin role
      SELECT auth_id INTO admin_auth_id 
      FROM public.users 
      WHERE email = 'ainematthew30@gmail.com';
      
      IF admin_auth_id IS NOT NULL THEN
        -- Update existing user to admin role
        UPDATE public.users 
        SET role = 'admin', status = 'active', profile_completed = true
        WHERE email = 'ainematthew30@gmail.com';
        
        -- Create or update profile
        INSERT INTO public.user_profiles (
          user_id,
          profile_type,
          profile_data
        ) VALUES (
          (SELECT id FROM public.users WHERE email = 'ainematthew30@gmail.com'),
          'admin',
          jsonb_build_object(
            'name', 'Admin User',
            'location', 'System'
          )
        ) ON CONFLICT (user_id) DO UPDATE SET
          profile_type = 'admin',
          profile_data = jsonb_build_object(
            'name', 'Admin User',
            'location', 'System'
          );
        
        RAISE NOTICE 'Existing user updated to admin role';
      ELSE
        RAISE NOTICE 'User exists but could not be updated';
      END IF;
  END;
END $$;
