-- ==========================================
-- 17-setup-admin-user.sql
-- Script to create an initial admin user
-- ==========================================

-- First, let's check if there are any users in the auth.users table
-- Note: This requires running in the Supabase SQL Editor with proper permissions
SELECT * FROM auth.users LIMIT 5;

-- If you don't have any users, you'll need to create one first through the Supabase Auth interface
-- Then come back and run this script to set their role to admin

-- To set an existing user as admin, you need their UUID
-- Replace 'YOUR_USER_ID_HERE' with the actual UUID of the user you want to make admin
-- You can find this in the auth.users table or in your Supabase Auth dashboard

-- Example (uncomment and replace with actual UUID):
-- UPDATE public.profiles 
-- SET role = 'admin', updated_at = NOW() 
-- WHERE id = 'YOUR_USER_ID_HERE';

-- Alternatively, if you want to create a new admin user directly (for development only):
-- Note: This assumes you've already created the auth user through the Supabase dashboard

-- INSERT INTO public.profiles (
--   id, 
--   email, 
--   full_name, 
--   role, 
--   is_active, 
--   email_verified,
--   created_at,
--   updated_at
-- ) VALUES (
--   '33333333-3333-3333-3333-333333333333',  -- Use a valid UUID from your auth.users table
--   'admin@sufiessences.com',
--   'Administrator',
--   'admin',
--   true,
--   true,
--   NOW(),
--   NOW()
-- ) ON CONFLICT (id) DO UPDATE SET
--   role = 'admin',
--   updated_at = NOW();

-- For development with direct login enabled, you can also use the mock admin user
-- The direct login config already has a mock admin user with ID '33333333-3333-3333-3333-333333333333'
-- Make sure this user exists in your database:

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

-- Verify the admin user was created/updated
SELECT id, email, full_name, role, is_active FROM public.profiles WHERE role = 'admin';

-- Test the is_admin function
SELECT public.is_admin('33333333-3333-3333-3333-333333333333') as is_admin_check;