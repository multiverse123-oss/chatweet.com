-- Create user_sessions table for single session control
CREATE TABLE public.user_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  session_token TEXT UNIQUE NOT NULL,
  device_id TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_activity TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT true
);

-- Create login_history table for tracking login/logout events
CREATE TABLE public.login_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  device_id TEXT NOT NULL,
  ip_address TEXT,
  action TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_history ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_sessions
CREATE POLICY "Users can view own sessions" 
ON public.user_sessions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions" 
ON public.user_sessions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions" 
ON public.user_sessions 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions" 
ON public.user_sessions 
FOR DELETE 
USING (auth.uid() = user_id);

-- RLS policies for login_history
CREATE POLICY "Users can view own login history" 
ON public.login_history 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own login history" 
ON public.login_history 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create index for faster session lookups
CREATE INDEX idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON public.user_sessions(session_token);
CREATE INDEX idx_login_history_user_id ON public.login_history(user_id);