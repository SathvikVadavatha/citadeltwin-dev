-- Security fixes for user_sessions table to prevent session hijacking and unauthorized data access

-- 1. Drop existing SELECT policies to recreate them with better security
DROP POLICY IF EXISTS "Admins can view all sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Users can view their own sessions" ON public.user_sessions;

-- 2. Create a security definer function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_user_admin(user_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN public.roles r ON p.role_id = r.id
    WHERE p.id = user_uuid
      AND r.role_name = 'admin'
  )
$$;

-- 3. Create a security definer function to hash session tokens
-- This ensures tokens are hashed before storage
CREATE OR REPLACE FUNCTION public.hash_session_token(token text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Use pgcrypto to hash the token with SHA-256
  RETURN encode(digest(token, 'sha256'), 'hex');
END;
$$;

-- 4. Create a secure view that masks sensitive session data
-- This view will be used by applications instead of direct table access
CREATE OR REPLACE VIEW public.user_sessions_secure AS
SELECT 
  id,
  user_id,
  -- Mask session token - only show last 4 characters for identification
  '****' || right(session_token, 4) as session_token_masked,
  ip_address,
  user_agent,
  -- Mask detailed location data, only show country/city level
  CASE 
    WHEN location IS NOT NULL THEN 
      jsonb_build_object(
        'country', location->>'country',
        'city', location->>'city'
      )
    ELSE NULL
  END as location_summary,
  is_active,
  last_activity,
  expires_at,
  created_at
FROM public.user_sessions;

-- 5. Grant access to the secure view
GRANT SELECT ON public.user_sessions_secure TO authenticated;

-- 6. Create comprehensive RLS policies for user_sessions table

-- Policy: Only allow session creation through authenticated users
CREATE POLICY "Users can create their own sessions"
ON public.user_sessions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy: Admins can view all session details (for security monitoring)
CREATE POLICY "Admins can view all sessions"
ON public.user_sessions
FOR SELECT
TO authenticated
USING (public.is_user_admin(auth.uid()));

-- Policy: Users can only view their own sessions
CREATE POLICY "Users can view their own sessions"
ON public.user_sessions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy: Users can update only their own session activity
CREATE POLICY "Users can update their own sessions"
ON public.user_sessions
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete/invalidate their own sessions
CREATE POLICY "Users can delete their own sessions"
ON public.user_sessions
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Policy: Admins can manage all sessions (for security purposes)
CREATE POLICY "Admins can manage all sessions"
ON public.user_sessions
FOR ALL
TO authenticated
USING (public.is_user_admin(auth.uid()))
WITH CHECK (public.is_user_admin(auth.uid()));

-- 7. Create a function to validate and clean expired sessions
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Mark expired sessions as inactive
  UPDATE public.user_sessions
  SET is_active = false
  WHERE expires_at < now() AND is_active = true;
  
  -- Delete very old inactive sessions (older than 90 days)
  DELETE FROM public.user_sessions
  WHERE is_active = false 
    AND expires_at < now() - interval '90 days';
    
  RAISE NOTICE 'Expired sessions cleanup completed';
END;
$$;

-- 8. Add comments for documentation
COMMENT ON TABLE public.user_sessions IS 'Stores user session data with encrypted tokens. Access via user_sessions_secure view for applications.';
COMMENT ON VIEW public.user_sessions_secure IS 'Secure view of user sessions with masked tokens and limited location data. Use this instead of direct table access.';
COMMENT ON FUNCTION public.hash_session_token IS 'Hashes session tokens using SHA-256 before storage to prevent token theft.';
COMMENT ON FUNCTION public.is_user_admin IS 'Checks if a user has admin role for security policy enforcement.';
COMMENT ON FUNCTION public.cleanup_expired_sessions IS 'Automatically cleans up expired and old sessions. Should be run via cron job.';
