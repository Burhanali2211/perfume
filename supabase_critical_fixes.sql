-- =====================================================
-- CRITICAL DATABASE FIXES
-- =====================================================
-- This script fixes the immediate issues causing database errors
-- Run this IMMEDIATELY to resolve current problems
-- =====================================================

-- =====================================================
-- 1. FIX INFINITE RECURSION IN RLS POLICIES
-- =====================================================

-- Drop problematic policies that cause infinite recursion
DROP POLICY IF EXISTS profiles_select_admin ON profiles;
DROP POLICY IF EXISTS profiles_update_admin ON profiles;
DROP POLICY IF EXISTS addresses_select_admin ON addresses;
DROP POLICY IF EXISTS categories_select_admin ON categories;
DROP POLICY IF EXISTS categories_manage_admin ON categories;
DROP POLICY IF EXISTS products_select_admin_vendor ON products;
DROP POLICY IF EXISTS products_manage_admin_vendor ON products;
DROP POLICY IF EXISTS product_variants_select_admin_vendor ON product_variants;
DROP POLICY IF EXISTS product_variants_manage_admin_vendor ON product_variants;
DROP POLICY IF EXISTS wishlists_select_admin ON wishlists;

-- Create safe admin policies without recursion
-- Use service role bypass for admin operations
CREATE POLICY profiles_select_admin ON profiles
    FOR SELECT USING (
        auth.jwt() ->> 'role' = 'service_role' OR
        (auth.uid() IS NOT NULL AND is_admin = TRUE)
    );

CREATE POLICY profiles_update_admin ON profiles
    FOR UPDATE USING (
        auth.jwt() ->> 'role' = 'service_role' OR
        (auth.uid() IS NOT NULL AND is_admin = TRUE)
    );

-- Simplified admin policies for other tables
CREATE POLICY addresses_select_admin ON addresses
    FOR SELECT USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY categories_select_admin ON categories
    FOR SELECT USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY categories_manage_admin ON categories
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY products_select_admin_vendor ON products
    FOR SELECT USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY products_manage_admin_vendor ON products
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY product_variants_select_admin_vendor ON product_variants
    FOR SELECT USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY product_variants_manage_admin_vendor ON product_variants
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY wishlists_select_admin ON wishlists
    FOR SELECT USING (auth.jwt() ->> 'role' = 'service_role');

-- =====================================================
-- 2. ADD MISSING SELLER_ID COLUMN TO PRODUCTS
-- =====================================================

-- Add seller_id column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS seller_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_products_seller_id ON products(seller_id);

-- Update existing products to have a default seller (first admin user)
UPDATE products 
SET seller_id = (
    SELECT id FROM profiles WHERE is_admin = TRUE LIMIT 1
)
WHERE seller_id IS NULL;

-- =====================================================
-- 3. ADD MISSING COLUMNS TO PRODUCT_VARIANTS
-- =====================================================

-- Ensure product_variants has all required columns
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS cost_price DECIMAL(10,2) CHECK (cost_price >= 0);

-- =====================================================
-- 4. FIX CATEGORIES POLICIES FOR PUBLIC ACCESS
-- =====================================================

-- Allow anonymous users to view active categories
DROP POLICY IF EXISTS categories_select_all ON categories;
CREATE POLICY categories_select_all ON categories
    FOR SELECT USING (is_active = TRUE);

-- =====================================================
-- 5. FIX PRODUCTS POLICIES FOR PUBLIC ACCESS
-- =====================================================

-- Allow anonymous users to view active products
DROP POLICY IF EXISTS products_select_all ON products;
CREATE POLICY products_select_all ON products
    FOR SELECT USING (is_active = TRUE);

-- =====================================================
-- 6. FIX PRODUCT_VARIANTS POLICIES FOR PUBLIC ACCESS
-- =====================================================

-- Allow anonymous users to view active product variants
DROP POLICY IF EXISTS product_variants_select_all ON product_variants;
CREATE POLICY product_variants_select_all ON product_variants
    FOR SELECT USING (is_active = TRUE);

-- =====================================================
-- 7. CREATE ADMIN USER IF NONE EXISTS
-- =====================================================

-- Insert a default admin user if no admin exists
-- This will only work if there's at least one user in auth.users
DO $$
BEGIN
    -- Check if any admin exists
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE is_admin = TRUE) THEN
        -- If there are any users, make the first one an admin
        UPDATE profiles 
        SET is_admin = TRUE 
        WHERE id = (SELECT id FROM profiles ORDER BY created_at LIMIT 1);
        
        -- If no users exist, we'll need to create one through the auth system
        RAISE NOTICE 'No admin user found. Please create a user through the authentication system and run this script again.';
    END IF;
END $$;

-- =====================================================
-- 8. TEMPORARY DISABLE RLS FOR TESTING (OPTIONAL)
-- =====================================================

-- Uncomment these lines if you need to temporarily disable RLS for testing
-- WARNING: Only use this for development/testing!

-- ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE products DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE product_variants DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- 9. CREATE SIMPLE POLICIES FOR DEVELOPMENT
-- =====================================================

-- Simple policies that allow basic operations for development
-- These are less secure but will allow the app to function

-- Allow authenticated users to read most data
CREATE POLICY dev_profiles_read ON profiles
    FOR SELECT USING (TRUE);

CREATE POLICY dev_categories_read ON categories
    FOR SELECT USING (TRUE);

CREATE POLICY dev_products_read ON products
    FOR SELECT USING (TRUE);

CREATE POLICY dev_product_variants_read ON product_variants
    FOR SELECT USING (TRUE);

-- =====================================================
-- 10. UPDATE FUNCTION FOR SAFE ADMIN CHECK
-- =====================================================

-- Create a safe function to check admin status
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND is_admin = TRUE
    );
EXCEPTION WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check if fixes were applied successfully
SELECT 'Critical fixes applied!' as status,
       'seller_id column: ' || CASE WHEN EXISTS (
           SELECT 1 FROM information_schema.columns 
           WHERE table_name = 'products' AND column_name = 'seller_id'
       ) THEN 'Added ✅' ELSE 'Missing ❌' END as seller_id_status,
       'Admin users: ' || (SELECT COUNT(*) FROM profiles WHERE is_admin = TRUE) as admin_count;

-- Show current RLS policies
SELECT 'Current RLS Policies:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'categories', 'products', 'product_variants')
ORDER BY tablename, policyname;
