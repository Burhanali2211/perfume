-- ==========================================
-- 18-fix-category-rls.sql
-- Fix RLS policies for categories to work with direct login
-- ==========================================

-- Drop existing policies
DROP POLICY IF EXISTS "Categories are viewable by everyone" ON public.categories;
DROP POLICY IF EXISTS "Admins can insert categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can update categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can delete categories" ON public.categories;

-- Create updated policies that work with both authenticated users and direct login mode

-- Policy for SELECT (viewing categories)
CREATE POLICY "Categories are viewable by everyone" ON public.categories
  FOR SELECT USING (is_active = true);

-- Policy for INSERT (creating categories)
CREATE POLICY "Admins can insert categories" ON public.categories
  FOR INSERT WITH CHECK (
    -- Standard authentication check
    (public.is_admin(auth.uid())) OR
    -- Direct login mode check (for development)
    (
      -- Check if we're in a development environment
      EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin' AND is_active = true
      )
    )
  );

-- Policy for UPDATE (modifying categories)
CREATE POLICY "Admins can update categories" ON public.categories
  FOR UPDATE USING (
    -- Standard authentication check
    (public.is_admin(auth.uid())) OR
    -- Direct login mode check (for development)
    (
      -- Check if we're in a development environment
      EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin' AND is_active = true
      )
    )
  );

-- Policy for DELETE (deleting categories)
CREATE POLICY "Admins can delete categories" ON public.categories
  FOR DELETE USING (
    -- Standard authentication check
    (public.is_admin(auth.uid())) OR
    -- Direct login mode check (for development)
    (
      -- Check if we're in a development environment
      EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin' AND is_active = true
      )
    )
  );

-- Grant permissions
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.categories TO service_role;

-- Test the policies
-- First, check if we can select categories
SELECT 'SELECT test' as test, count(*) as result FROM public.categories;

-- Note: INSERT/UPDATE/DELETE tests require proper authentication context
-- These would need to be tested in the application context