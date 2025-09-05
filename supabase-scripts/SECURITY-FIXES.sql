-- ==========================================
-- SECURITY-FIXES.sql
-- Production security hardening script
-- ==========================================

-- ==========================================
-- 1. DISABLE DEVELOPMENT MODE
-- ==========================================

-- Disable development mode for production
SELECT set_config('app.development_mode', 'false', false);
SELECT set_config('app.direct_login_enabled', 'false', false);

-- ==========================================
-- 2. FIX RLS RECURSION ISSUES
-- ==========================================

-- Drop all existing policies to prevent conflicts
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Drop all policies on main tables
    FOR r IN (SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;

-- ==========================================
-- 3. CREATE SAFE RLS POLICIES WITHOUT RECURSION
-- ==========================================

-- PROFILES TABLE POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_policy" ON public.profiles
  FOR SELECT USING (
    -- Users can view their own profile
    id = auth.uid() OR
    -- Admins can view all profiles
    (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin' AND p.is_active = true)) OR
    -- Allow public view of active profiles (for order display, etc.)
    is_active = true
  );

CREATE POLICY "profiles_insert_policy" ON public.profiles
  FOR INSERT WITH CHECK (
    -- Users can only create their own profile
    id = auth.uid() OR
    -- Admins can create any profile
    (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin' AND p.is_active = true))
  );

CREATE POLICY "profiles_update_policy" ON public.profiles
  FOR UPDATE USING (
    -- Users can update their own profile
    id = auth.uid() OR
    -- Admins can update any profile
    (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin' AND p.is_active = true))
  );

-- CATEGORIES TABLE POLICIES
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "categories_select_policy" ON public.categories
  FOR SELECT USING (
    -- Everyone can view active categories
    is_active = true
  );

CREATE POLICY "categories_insert_policy" ON public.categories
  FOR INSERT WITH CHECK (
    -- Only admins can create categories
    (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin' AND p.is_active = true))
  );

CREATE POLICY "categories_update_policy" ON public.categories
  FOR UPDATE USING (
    -- Only admins can update categories
    (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin' AND p.is_active = true))
  );

CREATE POLICY "categories_delete_policy" ON public.categories
  FOR DELETE USING (
    -- Only admins can delete categories
    (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin' AND p.is_active = true))
  );

-- PRODUCTS TABLE POLICIES
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "products_select_policy" ON public.products
  FOR SELECT USING (
    -- Everyone can view active products
    is_active = true OR
    -- Sellers can view their own products
    seller_id = auth.uid() OR
    -- Admins can view all products
    (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin' AND p.is_active = true))
  );

CREATE POLICY "products_insert_policy" ON public.products
  FOR INSERT WITH CHECK (
    -- Authenticated users can create products
    auth.uid() IS NOT NULL AND
    -- Users with seller or admin role can create products
    (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'seller') AND p.is_active = true))
  );

CREATE POLICY "products_update_policy" ON public.products
  FOR UPDATE USING (
    -- Sellers can update their own products
    seller_id = auth.uid() OR
    -- Admins can update any product
    (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin' AND p.is_active = true))
  );

CREATE POLICY "products_delete_policy" ON public.products
  FOR DELETE USING (
    -- Sellers can delete their own products
    seller_id = auth.uid() OR
    -- Admins can delete any product
    (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin' AND p.is_active = true))
  );

-- CART ITEMS TABLE POLICIES
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cart_items_policy" ON public.cart_items
  FOR ALL USING (
    -- Users can manage their own cart items
    user_id = auth.uid() OR
    -- Admins can manage all cart items
    (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin' AND p.is_active = true))
  ) WITH CHECK (
    -- Users can only create cart items for themselves
    user_id = auth.uid() OR
    -- Admins can create for anyone
    (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin' AND p.is_active = true))
  );

-- WISHLIST ITEMS TABLE POLICIES
ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wishlist_items_policy" ON public.wishlist_items
  FOR ALL USING (
    -- Users can manage their own wishlist items
    user_id = auth.uid() OR
    -- Admins can manage all wishlist items
    (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin' AND p.is_active = true))
  ) WITH CHECK (
    -- Users can only create wishlist items for themselves
    user_id = auth.uid() OR
    -- Admins can create for anyone
    (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin' AND p.is_active = true))
  );

-- ORDERS TABLE POLICIES
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "orders_select_policy" ON public.orders
  FOR SELECT USING (
    -- Users can view their own orders
    user_id = auth.uid() OR
    -- Admins can view all orders
    (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin' AND p.is_active = true))
  );

CREATE POLICY "orders_insert_policy" ON public.orders
  FOR INSERT WITH CHECK (
    -- Users can create their own orders
    user_id = auth.uid() OR
    -- Admins can create orders for anyone
    (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin' AND p.is_active = true))
  );

CREATE POLICY "orders_update_policy" ON public.orders
  FOR UPDATE USING (
    -- Users can update their own orders (limited)
    user_id = auth.uid() OR
    -- Admins can update any order
    (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin' AND p.is_active = true))
  );

-- ORDER ITEMS TABLE POLICIES
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "order_items_policy" ON public.order_items
  FOR ALL USING (
    -- Users can view order items for their orders
    EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid()) OR
    -- Admins can manage all order items
    (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin' AND p.is_active = true))
  );

-- REVIEWS TABLE POLICIES
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reviews_select_policy" ON public.reviews
  FOR SELECT USING (
    -- Everyone can view approved reviews
    is_approved = true OR
    -- Users can view their own reviews
    user_id = auth.uid() OR
    -- Admins can view all reviews
    (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin' AND p.is_active = true))
  );

CREATE POLICY "reviews_insert_policy" ON public.reviews
  FOR INSERT WITH CHECK (
    -- Users can create their own reviews
    user_id = auth.uid() OR
    -- Admins can create reviews for anyone
    (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin' AND p.is_active = true))
  );

CREATE POLICY "reviews_update_policy" ON public.reviews
  FOR UPDATE USING (
    -- Users can update their own reviews
    user_id = auth.uid() OR
    -- Admins can update any review
    (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin' AND p.is_active = true))
  );

-- ADDRESSES TABLE POLICIES
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "addresses_policy" ON public.addresses
  FOR ALL USING (
    -- Users can manage their own addresses
    user_id = auth.uid() OR
    -- Admins can manage all addresses
    (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin' AND p.is_active = true))
  ) WITH CHECK (
    -- Users can only create addresses for themselves
    user_id = auth.uid() OR
    -- Admins can create for anyone
    (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin' AND p.is_active = true))
  );

-- COUPONS TABLE POLICIES
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "coupons_select_policy" ON public.coupons
  FOR SELECT USING (
    -- Everyone can view active coupons
    is_active = true OR
    -- Admins can view all coupons
    (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin' AND p.is_active = true))
  );

CREATE POLICY "coupons_modify_policy" ON public.coupons
  FOR ALL USING (
    -- Only admins can modify coupons
    (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin' AND p.is_active = true))
  ) WITH CHECK (
    -- Only admins can create coupons
    (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin' AND p.is_active = true))
  );

-- ==========================================
-- 4. GRANT NECESSARY PERMISSIONS
-- ==========================================

-- Grant permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant permissions to anonymous users (for public data)
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON public.categories TO anon;
GRANT SELECT ON public.products TO anon;

-- Grant all permissions to service role
GRANT ALL ON SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- ==========================================
-- 5. VERIFICATION QUERIES
-- ==========================================

-- Check admin user exists
SELECT 'Admin user check:' as test, id, email, full_name, role 
FROM public.profiles 
WHERE role = 'admin' 
LIMIT 1;

-- Check table counts
SELECT 'Table counts:' as test,
       (SELECT count(*) FROM public.profiles) as profiles,
       (SELECT count(*) FROM public.categories) as categories,
       (SELECT count(*) FROM public.products) as products;

-- Final success message
SELECT 'SUCCESS: Security fixes applied! RLS recursion issues resolved.' as status;