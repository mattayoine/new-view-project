
-- Create the admin user account in auth.users with the specified password
-- This uses Supabase's auth functions to create a proper authenticated user

INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  invited_at,
  confirmation_token,
  confirmation_sent_at,
  recovery_token,
  recovery_sent_at,
  email_change_token_new,
  email_change,
  email_change_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  created_at,
  updated_at,
  phone,
  phone_confirmed_at,
  phone_change,
  phone_change_token,
  phone_change_sent_at,
  email_change_token_current,
  email_change_confirm_status,
  banned_until,
  reauthentication_token,
  reauthentication_sent_at,
  is_sso_user,
  deleted_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'ef65999c-9506-4312-8501-71d7d2e2f54f',
  'authenticated',
  'authenticated',
  'ainestuart58@gmail.com',
  crypt('eddybrandon', gen_salt('bf')),
  now(),
  now(),
  '',
  now(),
  '',
  null,
  '',
  '',
  null,
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"role": "admin"}',
  false,
  now(),
  now(),
  null,
  null,
  '',
  '',
  null,
  '',
  0,
  null,
  '',
  null,
  false,
  null
) ON CONFLICT (id) DO UPDATE SET
  encrypted_password = crypt('eddybrandon', gen_salt('bf')),
  email_confirmed_at = now(),
  raw_user_meta_data = '{"role": "admin"}',
  updated_at = now();

-- Create the corresponding user record in public.users
INSERT INTO public.users (
  auth_id,
  email,
  role,
  status,
  profile_completed,
  created_at,
  updated_at
) VALUES (
  'ef65999c-9506-4312-8501-71d7d2e2f54f',
  'ainestuart58@gmail.com',
  'admin',
  'active',
  true,
  now(),
  now()
) ON CONFLICT (auth_id) DO UPDATE SET
  role = 'admin',
  status = 'active',
  profile_completed = true,
  updated_at = now();

-- Create notification preferences for the admin user
INSERT INTO public.notification_preferences (user_id)
SELECT id FROM public.users WHERE auth_id = 'ef65999c-9506-4312-8501-71d7d2e2f54f'
ON CONFLICT (user_id) DO NOTHING;

-- Create user settings for the admin user
INSERT INTO public.user_settings (user_id)
SELECT id FROM public.users WHERE auth_id = 'ef65999c-9506-4312-8501-71d7d2e2f54f'
ON CONFLICT (user_id) DO NOTHING;
