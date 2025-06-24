
-- Fix potential auth triggers and ensure proper user creation
-- Update the handle_new_user function to be more robust
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Insert user record if it doesn't already exist
  INSERT INTO public.users (auth_id, email, role, status, profile_completed)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'founder'),
    'active',
    false
  )
  ON CONFLICT (auth_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Ensure the trigger exists and is properly configured
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add missing indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON public.users(auth_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

-- Ensure RLS policies are properly set
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create a policy for users to read their own data
DROP POLICY IF EXISTS "Users can read own data" ON public.users;
CREATE POLICY "Users can read own data" ON public.users
  FOR SELECT USING (auth.uid() = auth_id);

-- Create a policy for service role to manage users
DROP POLICY IF EXISTS "Service role can manage users" ON public.users;
CREATE POLICY "Service role can manage users" ON public.users
  FOR ALL USING (auth.role() = 'service_role');
