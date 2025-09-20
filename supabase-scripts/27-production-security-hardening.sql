-- ==========================================
-- 27-production-security-hardening.sql
-- Production security hardening and RLS policy updates
-- ==========================================

-- ==========================================
-- 1. DISABLE DEVELOPMENT-FRIENDLY POLICIES
-- ==========================================

-- Remove overly permissive development policies
DROP POLICY IF EXISTS "Allow category operations" ON public.categories;

-- Recreate strict production policies for categories
CREATE POLICY "Categories are viewable by everyone" ON public.categories
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can insert categories" ON public.categories
  FOR INSERT WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update categories" ON public.categories
  FOR UPDATE USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete categories" ON public.categories
  FOR DELETE USING (public.is_admin(auth.uid()));

-- ==========================================
-- 2. ENHANCE AUTHENTICATION FUNCTIONS FOR PRODUCTION
-- ==========================================

-- Update is_admin function to be more secure
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Strict admin check for production
  IF user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_id 
    AND role = 'admin' 
    AND is_active = true
    AND email_verified = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update is_seller function
CREATE OR REPLACE FUNCTION public.is_seller(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  IF user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_id 
    AND role IN ('seller', 'admin') 
    AND is_active = true
    AND email_verified = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 3. ADD RATE LIMITING FUNCTION
-- ==========================================

CREATE OR REPLACE FUNCTION public.check_rate_limit(
  user_identifier TEXT,
  action_type TEXT,
  max_attempts INTEGER DEFAULT 10,
  window_minutes INTEGER DEFAULT 60
)
RETURNS BOOLEAN AS $$
DECLARE
  attempt_count INTEGER;
  window_start TIMESTAMP WITH TIME ZONE;
BEGIN
  window_start := NOW() - INTERVAL '1 minute' * window_minutes;
  
  -- Count recent attempts
  SELECT COUNT(*) INTO attempt_count
  FROM public.analytics_events
  WHERE event_type = 'rate_limit_check'
  AND metadata->>'user_identifier' = user_identifier
  AND metadata->>'action_type' = action_type
  AND created_at >= window_start;
  
  -- Log this attempt
  INSERT INTO public.analytics_events (event_type, metadata)
  VALUES ('rate_limit_check', json_build_object(
    'user_identifier', user_identifier,
    'action_type', action_type,
    'attempt_count', attempt_count + 1
  ));
  
  RETURN attempt_count < max_attempts;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 4. ENHANCE INPUT VALIDATION
-- ==========================================

-- Enhanced email validation
CREATE OR REPLACE FUNCTION public.is_valid_email(email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- More strict email validation
  RETURN email IS NOT NULL 
    AND length(email) <= 254
    AND email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
    AND email NOT LIKE '%..%'
    AND email NOT LIKE '.%'
    AND email NOT LIKE '%.'
    AND position('@' in email) > 1
    AND position('@' in email) < length(email);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Enhanced phone validation (international format)
CREATE OR REPLACE FUNCTION public.is_valid_phone(phone TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Support international phone formats
  RETURN phone IS NOT NULL 
    AND length(phone) >= 10 
    AND length(phone) <= 15
    AND phone ~ '^[\+]?[1-9][\d]{9,14}$';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ==========================================
-- 5. ADD AUDIT LOGGING FOR SENSITIVE OPERATIONS
-- ==========================================

-- Enhanced audit logging function
CREATE OR REPLACE FUNCTION public.log_security_event(
  event_type TEXT,
  description TEXT,
  user_id UUID DEFAULT auth.uid(),
  metadata JSONB DEFAULT NULL,
  severity TEXT DEFAULT 'info'
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.auth_audit_log (
    user_id, 
    event_type, 
    metadata
  )
  VALUES (
    user_id, 
    'security_' || event_type, 
    jsonb_build_object(
      'description', description,
      'severity', severity,
      'timestamp', NOW(),
      'ip_address', current_setting('request.headers', true)::json->>'x-forwarded-for'
    ) || COALESCE(metadata, '{}')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 6. CREATE SECURITY MONITORING TRIGGERS
-- ==========================================

-- Function to monitor failed login attempts
CREATE OR REPLACE FUNCTION public.monitor_auth_events()
RETURNS TRIGGER AS $$
BEGIN
  -- Log authentication events
  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_security_event(
      'auth_attempt',
      'Authentication attempt logged',
      NEW.user_id,
      jsonb_build_object('event_type', NEW.event_type)
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for auth audit log
DROP TRIGGER IF EXISTS auth_events_monitor ON public.auth_audit_log;
CREATE TRIGGER auth_events_monitor
  AFTER INSERT ON public.auth_audit_log
  FOR EACH ROW
  EXECUTE FUNCTION public.monitor_auth_events();

-- ==========================================
-- 7. SECURE SENSITIVE DATA ACCESS
-- ==========================================

-- Create policy for payment methods (more restrictive)
DROP POLICY IF EXISTS "Users can view their own payment methods" ON public.payment_methods;
DROP POLICY IF EXISTS "Users can insert their own payment methods" ON public.payment_methods;
DROP POLICY IF EXISTS "Users can update their own payment methods" ON public.payment_methods;

CREATE POLICY "Users can view their own payment methods" ON public.payment_methods
  FOR SELECT USING (
    auth.uid() = user_id 
    AND public.check_rate_limit(auth.uid()::text, 'payment_access', 50, 60)
  );

CREATE POLICY "Users can insert their own payment methods" ON public.payment_methods
  FOR INSERT WITH CHECK (
    auth.uid() = user_id 
    AND public.check_rate_limit(auth.uid()::text, 'payment_insert', 10, 60)
  );

CREATE POLICY "Users can update their own payment methods" ON public.payment_methods
  FOR UPDATE USING (
    auth.uid() = user_id 
    AND public.check_rate_limit(auth.uid()::text, 'payment_update', 20, 60)
  );

-- ==========================================
-- 8. ADD DATA RETENTION POLICIES
-- ==========================================

-- Function to clean up old audit logs
CREATE OR REPLACE FUNCTION public.cleanup_old_audit_logs()
RETURNS VOID AS $$
BEGIN
  -- Delete audit logs older than 1 year
  DELETE FROM public.auth_audit_log
  WHERE created_at < NOW() - INTERVAL '1 year';
  
  -- Delete old analytics events (keep 6 months)
  DELETE FROM public.analytics_events
  WHERE created_at < NOW() - INTERVAL '6 months'
  AND event_type NOT IN ('purchase', 'order_completed');
  
  -- Delete old system health metrics (keep 3 months)
  DELETE FROM public.system_health_metrics
  WHERE recorded_at < NOW() - INTERVAL '3 months';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 9. CREATE PRODUCTION ENVIRONMENT CHECK
-- ==========================================

CREATE OR REPLACE FUNCTION public.is_production_environment()
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if we're in production based on various indicators
  RETURN (
    current_setting('app.environment', true) = 'production'
    OR current_setting('app.direct_login_enabled', true) != 'true'
    OR EXISTS (SELECT 1 FROM public.profiles WHERE role = 'admin' AND email_verified = true)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 10. FINAL SECURITY VERIFICATION
-- ==========================================

-- Verify all critical tables have RLS enabled
DO $$
DECLARE
    table_record RECORD;
    missing_rls TEXT[] := ARRAY[]::TEXT[];
BEGIN
    FOR table_record IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN (
            'profiles', 'categories', 'products', 'orders', 'order_items',
            'cart_items', 'wishlist_items', 'reviews', 'coupons', 'addresses',
            'payment_methods', 'user_preferences', 'user_security_settings',
            'system_settings', 'marketing_campaigns', 'campaign_metrics'
        )
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM pg_class c
            JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE n.nspname = 'public' 
            AND c.relname = table_record.tablename
            AND c.relrowsecurity = true
        ) THEN
            missing_rls := array_append(missing_rls, table_record.tablename);
        END IF;
    END LOOP;
    
    IF array_length(missing_rls, 1) > 0 THEN
        RAISE NOTICE 'WARNING: The following tables do not have RLS enabled: %', array_to_string(missing_rls, ', ');
    ELSE
        RAISE NOTICE 'SUCCESS: All critical tables have RLS enabled';
    END IF;
END $$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.check_rate_limit(TEXT, TEXT, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_valid_email(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_valid_phone(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_old_audit_logs() TO service_role;

SELECT 'Production security hardening completed successfully' as status;
SELECT 'Environment check: ' || CASE WHEN public.is_production_environment() THEN 'PRODUCTION' ELSE 'DEVELOPMENT' END as environment;
