-- ==========================================
-- 19-corrected-setup-admin-user.sql
-- Script to create an initial admin user (corrected version)
-- ==========================================

-- First, let's check if there are any users in the auth.users table
-- Note: This requires running in the Supabase SQL Editor with proper permissions
SELECT 'Auth users count' as info, count(*) as count FROM auth.users;

-- Check if our target admin user already exists in auth.users
SELECT 'Target admin user check' as info, id, email FROM auth.users 
WHERE id = '33333333-3333-3333-3333-333333333333' OR 
      email = 'admin@sufiessences.com';

-- IMPORTANT: You must first create the user in the Supabase Auth system
-- This can be done through the Supabase Dashboard:
-- 1. Go to Authentication > Users
-- 2. Click "Add user"
-- 3. Enter email: admin@sufiessences.com
-- 4. Enter a password
-- 5. Click "Create user"

-- After creating the user through the dashboard, get the actual UUID from the auth.users table
-- Then use that UUID in the script below

-- For development with direct login, we can work with the mock users
-- But we still need to ensure the foreign key constraint is satisfied

-- Option 1: If you have an existing user, update their role to admin
-- Replace 'EXISTING_USER_ID' with an actual user ID from your auth.users table
/*
UPDATE public.profiles 
SET role = 'admin', updated_at = NOW() 
WHERE id = 'EXISTING_USER_ID';
*/

-- Option 2: If you're in direct login mode, you can temporarily disable the foreign key constraint
-- WARNING: This is only for development and should not be used in production
/*
-- Temporarily disable foreign key checks (PostgreSQL doesn't have this, so we need a different approach)

-- Alternative approach: Create a dummy auth user entry (NOT RECOMMENDED FOR PRODUCTION)
-- This is just for development/testing purposes
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES (
  '33333333-3333-3333-3333-333333333333',
  'admin@sufiessences.com',
  '$2a$10$vQx9/U75W9qNPtju1dd9n.IZF0D16d9KBaO3/F1Bo34L.Fc2zZ8Wy', -- password: password (for development only!)
  NOW(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Administrator"}'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Now create the profile
INSERT INTO public.profiles (
  id, 
  email, 
  full_name, 
  role, 
  is_active, 
  email_verified,
  created_at,
  updated_at
) VALUES (
  '33333333-3333-3333-3333-333333333333',
  'admin@sufiessences.com',
  'Khalid Hassan',
  'admin',
  true,
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  role = 'admin',
  updated_at = NOW();
*/

-- Option 3: Recommended approach - Use an existing user
-- First, find an existing user:
SELECT 'Existing users' as info, id, email FROM auth.users LIMIT 5;

-- Then update their profile to be admin (replace 'ACTUAL_USER_ID' with a real ID from above):
/*
INSERT INTO public.profiles (
  id, 
  email, 
  full_name, 
  role, 
  is_active, 
  email_verified,
  created_at,
  updated_at
) VALUES (
  'ACTUAL_USER_ID',
  'admin@sufiessences.com',
  'Administrator',
  'admin',
  true,
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  role = 'admin',
  full_name = 'Administrator',
  updated_at = NOW();
*/

-- For direct login mode, we can also modify the RLS policies to allow direct login users
-- This is a safer approach for development

-- Drop existing category policies
DROP POLICY IF EXISTS "Admins can insert categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can update categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can delete categories" ON public.categories;

-- Create new policies that work with direct login mode
CREATE POLICY "Admins can insert categories" ON public.categories
  FOR INSERT WITH CHECK (
    -- Standard authentication check
    (public.is_admin(auth.uid())) OR
    -- Direct login mode check - allow if direct login is enabled
    (current_setting('app.direct_login_enabled', true) = 'true')
  );

CREATE POLICY "Admins can update categories" ON public.categories
  FOR UPDATE USING (
    -- Standard authentication check
    (public.is_admin(auth.uid())) OR
    -- Direct login mode check
    (current_setting('app.direct_login_enabled', true) = 'true')
  );

CREATE POLICY "Admins can delete categories" ON public.categories
  FOR DELETE USING (
    -- Standard authentication check
    (public.is_admin(auth.uid())) OR
    -- Direct login mode check
    (current_setting('app.direct_login_enabled', true) = 'true')
  );

-- Verify the admin user was created/updated
SELECT 'Admin profiles' as info, id, email, full_name, role FROM public.profiles WHERE role = 'admin';

-- Test the is_admin function
SELECT 'is_admin test' as info, public.is_admin(id) as is_admin_result FROM public.profiles WHERE role = 'admin' LIMIT 1;