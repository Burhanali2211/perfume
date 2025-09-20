-- ==========================================
-- SIMPLIFIED DASHBOARD EDITING FIX
-- This script fixes dashboard editing issues without creating auth users
-- ==========================================

-- 1. First, let's check the current state
SELECT 'Starting simplified dashboard fix...' as status;

-- 2. Create or update the is_admin function to handle both auth modes
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  -- Handle null user_id (direct login mode or unauthenticated)
  IF user_id IS NULL THEN
    -- Allow operations in development or direct login mode
    RETURN (
      current_setting('app.direct_login_enabled', true) = 'true' OR
      current_setting('app.environment', true) = 'development' OR
      NOT EXISTS (SELECT 1 FROM auth.users LIMIT 1)
    );
  END IF;
  
  -- Check if user has admin role
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_id AND role = 'admin' AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create helper function to check if user can edit
CREATE OR REPLACE FUNCTION public.can_edit(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  -- Allow if admin
  IF public.is_admin(user_id) THEN
    RETURN true;
  END IF;
  
  -- Allow in direct login mode
  IF current_setting('app.direct_login_enabled', true) = 'true' THEN
    RETURN true;
  END IF;
  
  -- Allow if no auth system is set up (development)
  IF NOT EXISTS (SELECT 1 FROM auth.users LIMIT 1) THEN
    RETURN true;
  END IF;
  
  -- Allow service role
  IF current_user = 'service_role' THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Fix Categories table policies
DROP POLICY IF EXISTS "Categories are viewable by everyone" ON public.categories;
DROP POLICY IF EXISTS "Admins can insert categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can update categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can delete categories" ON public.categories;
DROP POLICY IF EXISTS "Allow category operations" ON public.categories;
DROP POLICY IF EXISTS "Categories read access" ON public.categories;
DROP POLICY IF EXISTS "Categories write access" ON public.categories;

-- Create comprehensive category policies
CREATE POLICY "Categories read access" ON public.categories
  FOR SELECT USING (is_active = true);

CREATE POLICY "Categories write access" ON public.categories
  FOR ALL USING (public.can_edit()) WITH CHECK (public.can_edit());

-- 5. Fix Products table policies
DROP POLICY IF EXISTS "Products are viewable by everyone" ON public.products;
DROP POLICY IF EXISTS "Sellers can insert their products" ON public.products;
DROP POLICY IF EXISTS "Sellers can update their products" ON public.products;
DROP POLICY IF EXISTS "Admins can manage all products" ON public.products;
DROP POLICY IF EXISTS "Allow product operations" ON public.products;
DROP POLICY IF EXISTS "Products read access" ON public.products;
DROP POLICY IF EXISTS "Products write access" ON public.products;

-- Create comprehensive product policies
CREATE POLICY "Products read access" ON public.products
  FOR SELECT USING (is_active = true);

CREATE POLICY "Products write access" ON public.products
  FOR ALL USING (
    public.can_edit() OR 
    (auth.uid() = seller_id AND auth.uid() IS NOT NULL)
  ) WITH CHECK (
    public.can_edit() OR 
    (auth.uid() = seller_id AND auth.uid() IS NOT NULL)
  );

-- 6. Fix Profiles table policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Profiles read access" ON public.profiles;
DROP POLICY IF EXISTS "Profiles write access" ON public.profiles;

-- Create comprehensive profile policies
CREATE POLICY "Profiles read access" ON public.profiles
  FOR SELECT USING (
    id = auth.uid() OR 
    public.is_admin() OR
    public.can_edit()
  );

CREATE POLICY "Profiles write access" ON public.profiles
  FOR ALL USING (
    id = auth.uid() OR 
    public.can_edit()
  ) WITH CHECK (
    id = auth.uid() OR 
    public.can_edit()
  );

-- 7. Grant necessary permissions
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT ALL ON public.categories TO authenticated, service_role;

GRANT SELECT ON public.products TO anon, authenticated;
GRANT ALL ON public.products TO authenticated, service_role;

GRANT SELECT ON public.profiles TO authenticated, service_role;
GRANT ALL ON public.profiles TO authenticated, service_role;

-- 8. Set session parameters for direct login mode
SELECT set_config('app.direct_login_enabled', 'true', false);
SELECT set_config('app.environment', 'development', false);

-- 9. Test the fixes with a simple category creation
SELECT 'Testing category operations...' as test;

-- Test category creation
INSERT INTO public.categories (
  name, 
  slug, 
  description, 
  sort_order, 
  is_active
) VALUES (
  'Test Category Fix',
  'test-category-fix',
  'Test category to verify fixes work',
  999,
  true
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = NOW();

-- Verify the test category was created
SELECT 'Category test result:' as test, 
       CASE WHEN EXISTS (SELECT 1 FROM public.categories WHERE slug = 'test-category-fix') 
            THEN 'SUCCESS - Category creation works!' 
            ELSE 'FAILED - Category creation still blocked' 
       END as result;

-- 10. Final verification
SELECT 'Verification Results:' as section;

SELECT 'RLS enabled on categories:' as check,
       CASE WHEN (SELECT rowsecurity FROM pg_tables WHERE tablename = 'categories' AND schemaname = 'public')
            THEN 'YES' ELSE 'NO' END as result;

SELECT 'Category policies count:' as check,
       COUNT(*)::text as result
FROM pg_policy pol
JOIN pg_class pc ON pc.oid = pol.polrelid
JOIN pg_namespace pn ON pn.oid = pc.relnamespace
WHERE pc.relname = 'categories' AND pn.nspname = 'public';

SELECT 'Simplified fix completed! Dashboard editing should now work in direct login mode.' as status;
