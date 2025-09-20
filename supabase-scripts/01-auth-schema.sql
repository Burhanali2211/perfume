-- ==========================================
-- 01-auth-schema.sql
-- Authentication tables and basic setup
-- ==========================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create auth roles if they don't exist
DO $$
BEGIN
  CREATE ROLE anon NOLOGIN;
EXCEPTION WHEN DUPLICATE_OBJECT THEN
  RAISE NOTICE 'Role anon already exists';
END
$$;

DO $$
BEGIN
  CREATE ROLE authenticated NOLOGIN;
EXCEPTION WHEN DUPLICATE_OBJECT THEN
  RAISE NOTICE 'Role authenticated already exists';
END
$$;

DO $$
BEGIN
  CREATE ROLE service_role NOLOGIN;
EXCEPTION WHEN DUPLICATE_OBJECT THEN
  RAISE NOTICE 'Role service_role already exists';
END
$$;

-- Grant usage on auth schema to roles
GRANT USAGE ON SCHEMA auth TO anon, authenticated, service_role;

-- Grant necessary permissions
GRANT ALL PRIVILEGES ON TABLE auth.users TO service_role;
GRANT ALL PRIVILEGES ON TABLE auth.refresh_tokens TO service_role;

-- ==========================================
-- Custom Authentication Extensions
-- ==========================================

-- Create a function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create a profile for the new user
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    CASE 
      WHEN NEW.email = 'admin@sufiessences.com' THEN 'admin'
      ELSE 'customer'
    END
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==========================================
-- Auth Audit Logging
-- ==========================================

-- Create table for auth events logging
CREATE TABLE IF NOT EXISTS public.auth_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  event_type TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Grant permissions for auth audit log
GRANT SELECT, INSERT ON public.auth_audit_log TO authenticated;
GRANT ALL ON public.auth_audit_log TO service_role;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_auth_audit_log_user_id ON public.auth_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_audit_log_event_type ON public.auth_audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_auth_audit_log_created_at ON public.auth_audit_log(created_at);

-- ==========================================
-- Auth Security Functions
-- ==========================================

-- Function to log auth events
CREATE OR REPLACE FUNCTION public.log_auth_event(
  p_user_id UUID,
  p_event_type TEXT,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.auth_audit_log (user_id, event_type, ip_address, user_agent, metadata)
  VALUES (p_user_id, p_event_type, p_ip_address, p_user_agent, p_metadata);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- Auth Helper Functions
-- ==========================================

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_id AND role = 'admin' AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is seller
CREATE OR REPLACE FUNCTION public.is_seller(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_id AND role = 'seller' AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is customer
CREATE OR REPLACE FUNCTION public.is_customer(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_id AND role = 'customer' AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- Auth Security Policies
-- ==========================================

-- Enable RLS on auth audit log
ALTER TABLE public.auth_audit_log ENABLE ROW LEVEL SECURITY;

-- Create policies for auth audit log
CREATE POLICY "Users can view their own auth logs" ON public.auth_audit_log
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all auth logs" ON public.auth_audit_log
  FOR SELECT USING (public.is_admin(auth.uid()));

CREATE POLICY "Service role can insert auth logs" ON public.auth_audit_log
  FOR INSERT WITH CHECK (TRUE);

-- Grant permissions
GRANT SELECT ON public.auth_audit_log TO authenticated;
GRANT INSERT ON public.auth_audit_log TO service_role;