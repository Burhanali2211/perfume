-- ==========================================
-- 13-security-policies.sql
-- Row Level Security policies and security functions
-- ==========================================

-- ==========================================
-- Security Helper Functions
-- ==========================================

-- Function to check if user can access a resource
CREATE OR REPLACE FUNCTION public.can_access_resource(
  resource_type TEXT,
  resource_id UUID,
  user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Admins can access everything
  IF public.is_admin(user_id) THEN
    RETURN TRUE;
  END IF;
  
  -- Check based on resource type
  CASE resource_type
    WHEN 'product' THEN
      RETURN EXISTS (
        SELECT 1 FROM public.products 
        WHERE id = resource_id AND (seller_id = user_id OR is_active = true)
      );
    WHEN 'order' THEN
      RETURN EXISTS (
        SELECT 1 FROM public.orders 
        WHERE id = resource_id AND (user_id = user_id OR user_id IS NULL)
      );
    WHEN 'profile' THEN
      RETURN resource_id = user_id;
    ELSE
      RETURN FALSE;
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to sanitize input
CREATE OR REPLACE FUNCTION public.sanitize_input(input_text TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Remove potentially dangerous characters
  RETURN REGEXP_REPLACE(input_text, '[<>"''&]', '', 'g');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ==========================================
-- Security Audit Functions
-- ==========================================

-- Function to log security events
CREATE OR REPLACE FUNCTION public.log_security_event(
  event_type TEXT,
  description TEXT,
  user_id UUID DEFAULT auth.uid(),
  metadata JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.auth_audit_log (user_id, event_type, metadata)
  VALUES (user_id, 'security_' || event_type, jsonb_build_object('description', description) || COALESCE(metadata, '{}'));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- Data Validation Functions
-- ==========================================

-- Function to validate email format
CREATE OR REPLACE FUNCTION public.is_valid_email(email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to validate phone number format (Indian format)
CREATE OR REPLACE FUNCTION public.is_valid_phone(phone TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN phone ~* '^(\+91|91|0)?[6-9][0-9]{9}$';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to validate pincode format (Indian format)
CREATE OR REPLACE FUNCTION public.is_valid_pincode(pincode TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN pincode ~* '^[1-9][0-9]{5}$';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ==========================================
-- Rate Limiting Functions
-- ==========================================

-- Create table for rate limiting
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id),
  action TEXT NOT NULL,
  attempt_count INTEGER DEFAULT 1,
  last_attempt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  blocked_until TIMESTAMP WITH TIME ZONE
);

-- Create indexes for rate limits
CREATE INDEX IF NOT EXISTS idx_rate_limits_user_id ON public.rate_limits(user_id);
CREATE INDEX IF NOT EXISTS idx_rate_limits_action ON public.rate_limits(action);
CREATE INDEX IF NOT EXISTS idx_rate_limits_last_attempt ON public.rate_limits(last_attempt);

-- Function to check rate limit
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  user_id UUID,
  action TEXT,
  max_attempts INTEGER DEFAULT 5,
  time_window INTERVAL DEFAULT '15 minutes',
  block_duration INTERVAL DEFAULT '1 hour'
)
RETURNS TABLE(
  is_allowed BOOLEAN,
  attempts_remaining INTEGER,
  blocked_until TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
  attempt_record RECORD;
BEGIN
  -- Get existing record
  SELECT * INTO attempt_record
  FROM public.rate_limits
  WHERE user_id = user_id AND action = action;
  
  -- Check if user is blocked
  IF attempt_record.blocked_until IS NOT NULL AND attempt_record.blocked_until > NOW() THEN
    RETURN QUERY SELECT FALSE, 0, attempt_record.blocked_until;
    RETURN;
  END IF;
  
  -- Check if we need to reset the counter (time window has passed)
  IF attempt_record.last_attempt IS NULL OR attempt_record.last_attempt < NOW() - time_window THEN
    -- Reset or create new record
    INSERT INTO public.rate_limits (user_id, action, attempt_count, last_attempt)
    VALUES (user_id, action, 1, NOW())
    ON CONFLICT (user_id, action) DO UPDATE
    SET attempt_count = 1, last_attempt = NOW(), blocked_until = NULL;
    
    RETURN QUERY SELECT TRUE, max_attempts - 1, NULL::TIMESTAMP WITH TIME ZONE;
    RETURN;
  END IF;
  
  -- Increment attempt count
  UPDATE public.rate_limits
  SET attempt_count = attempt_count + 1, last_attempt = NOW()
  WHERE user_id = user_id AND action = action;
  
  -- Check if we've exceeded the limit
  IF attempt_record.attempt_count + 1 >= max_attempts THEN
    -- Block the user
    UPDATE public.rate_limits
    SET blocked_until = NOW() + block_duration
    WHERE user_id = user_id AND action = action;
    
    RETURN QUERY SELECT FALSE, 0, NOW() + block_duration;
    RETURN;
  END IF;
  
  -- Still allowed
  RETURN QUERY SELECT TRUE, max_attempts - (attempt_record.attempt_count + 1), NULL::TIMESTAMP WITH TIME ZONE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- Security Views
-- ==========================================

-- Create a view for security audit logs
CREATE OR REPLACE VIEW public.security_audit AS
SELECT 
  id,
  user_id,
  event_type,
  metadata->>'description' as description,
  created_at
FROM public.auth_audit_log
WHERE event_type LIKE 'security_%'
ORDER BY created_at DESC;

-- Grant permissions on the view
GRANT SELECT ON public.security_audit TO service_role;

-- ==========================================
-- Security Procedures
-- ==========================================

-- Procedure to reset rate limits for a user
CREATE OR REPLACE PROCEDURE public.reset_rate_limits(user_id UUID)
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM public.rate_limits WHERE user_id = user_id;
END;
$$;

-- Procedure to block a user
CREATE OR REPLACE PROCEDURE public.block_user(
  user_id UUID,
  reason TEXT,
  duration INTERVAL DEFAULT '24 hours'
)
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update user profile
  UPDATE public.profiles
  SET is_active = false
  WHERE id = user_id;
  
  -- Log the action
  INSERT INTO public.auth_audit_log (user_id, event_type, metadata)
  VALUES (user_id, 'security_user_blocked', jsonb_build_object('reason', reason, 'duration', duration));
END;
$$;

-- Procedure to unblock a user
CREATE OR REPLACE PROCEDURE public.unblock_user(user_id UUID, reason TEXT)
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update user profile
  UPDATE public.profiles
  SET is_active = true
  WHERE id = user_id;
  
  -- Log the action
  INSERT INTO public.auth_audit_log (user_id, event_type, metadata)
  VALUES (user_id, 'security_user_unblocked', jsonb_build_object('reason', reason));
END;
$$;