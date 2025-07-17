
-- Create user_oauth_tokens table for storing OAuth credentials
CREATE TABLE public.user_oauth_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at BIGINT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, provider)
);

-- Enable RLS
ALTER TABLE public.user_oauth_tokens ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own OAuth tokens" 
ON public.user_oauth_tokens 
FOR ALL 
USING (user_id = get_current_user_id())
WITH CHECK (user_id = get_current_user_id());

-- Create updated_at trigger
CREATE TRIGGER update_user_oauth_tokens_updated_at
  BEFORE UPDATE ON public.user_oauth_tokens
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
