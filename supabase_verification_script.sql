-- =====================================================
-- DATABASE VERIFICATION SCRIPT
-- =====================================================
-- Run this script to verify your database setup is complete and working
-- This should be run AFTER the main schema and sample data scripts
-- =====================================================

-- Check if all required extensions are enabled
SELECT 
    'Extensions Check' as test_category,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'uuid-ossp') 
        AND EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm')
        THEN '✅ All required extensions are enabled'
        ELSE '❌ Missing required extensions'
    END as result;

-- Check if all tables exist
WITH expected_tables AS (
    SELECT unnest(ARRAY[
        'profiles', 'addresses', 'categories', 'products', 'product_variants',
        'carts', 'cart_items', 'wishlists', 'wishlist_items', 'orders',
        'order_items', 'order_tracking', 'reviews', 'coupons', 'coupon_usage'
    ]) as table_name
),
existing_tables AS (
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
)
SELECT 
    'Tables Check' as test_category,
    CASE 
        WHEN (SELECT COUNT(*) FROM expected_tables) = (SELECT COUNT(*) FROM expected_tables e JOIN existing_tables ex ON e.table_name = ex.table_name)
        THEN '✅ All ' || (SELECT COUNT(*) FROM expected_tables) || ' tables created successfully'
        ELSE '❌ Missing tables: ' || (
            SELECT string_agg(table_name, ', ') 
            FROM expected_tables 
            WHERE table_name NOT IN (SELECT table_name FROM existing_tables)
        )
    END as result;

-- Check if RLS is enabled on all tables
WITH tables_with_rls AS (
    SELECT schemaname, tablename, rowsecurity
    FROM pg_tables 
    WHERE schemaname = 'public'
    AND tablename IN ('profiles', 'addresses', 'categories', 'products', 'product_variants',
                      'carts', 'cart_items', 'wishlists', 'wishlist_items', 'orders',
                      'order_items', 'order_tracking', 'reviews', 'coupons', 'coupon_usage')
)
SELECT 
    'RLS Check' as test_category,
    CASE 
        WHEN (SELECT COUNT(*) FROM tables_with_rls WHERE rowsecurity = false) = 0
        THEN '✅ RLS enabled on all ' || (SELECT COUNT(*) FROM tables_with_rls) || ' tables'
        ELSE '❌ RLS not enabled on: ' || (
            SELECT string_agg(tablename, ', ') 
            FROM tables_with_rls 
            WHERE rowsecurity = false
        )
    END as result;

-- Check if indexes are created
WITH expected_indexes AS (
    SELECT unnest(ARRAY[
        'idx_profiles_email', 'idx_products_slug', 'idx_products_sku',
        'idx_categories_slug', 'idx_orders_order_number', 'idx_reviews_product_id'
    ]) as index_name
),
existing_indexes AS (
    SELECT indexname as index_name
    FROM pg_indexes
    WHERE schemaname = 'public'
)
SELECT 
    'Indexes Check' as test_category,
    CASE 
        WHEN (SELECT COUNT(*) FROM expected_indexes e JOIN existing_indexes ex ON e.index_name = ex.index_name) >= 6
        THEN '✅ Key indexes created successfully'
        ELSE '❌ Some indexes may be missing'
    END as result;

-- Check if functions exist
WITH expected_functions AS (
    SELECT unnest(ARRAY[
        'update_updated_at_column', 'generate_order_number', 
        'update_product_rating', 'handle_new_user'
    ]) as function_name
),
existing_functions AS (
    SELECT routine_name as function_name
    FROM information_schema.routines
    WHERE routine_schema = 'public'
    AND routine_type = 'FUNCTION'
)
SELECT 
    'Functions Check' as test_category,
    CASE 
        WHEN (SELECT COUNT(*) FROM expected_functions e JOIN existing_functions ex ON e.function_name = ex.function_name) = 4
        THEN '✅ All 4 custom functions created'
        ELSE '❌ Missing functions: ' || (
            SELECT string_agg(function_name, ', ') 
            FROM expected_functions 
            WHERE function_name NOT IN (SELECT function_name FROM existing_functions)
        )
    END as result;

-- Check if triggers exist
SELECT 
    'Triggers Check' as test_category,
    CASE 
        WHEN (SELECT COUNT(*) FROM information_schema.triggers WHERE trigger_schema = 'public') >= 10
        THEN '✅ Triggers created successfully'
        ELSE '❌ Some triggers may be missing'
    END as result;

-- Check sample data (if inserted)
SELECT 
    'Sample Data Check' as test_category,
    CASE 
        WHEN (SELECT COUNT(*) FROM categories) >= 6 
        AND (SELECT COUNT(*) FROM products) >= 8
        AND (SELECT COUNT(*) FROM coupons) >= 5
        THEN '✅ Sample data loaded: ' || 
             (SELECT COUNT(*) FROM categories) || ' categories, ' ||
             (SELECT COUNT(*) FROM products) || ' products, ' ||
             (SELECT COUNT(*) FROM coupons) || ' coupons'
        ELSE '⚠️ Sample data not loaded or incomplete'
    END as result;

-- Check RLS policies count
SELECT 
    'RLS Policies Check' as test_category,
    CASE 
        WHEN (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public') >= 20
        THEN '✅ RLS policies created: ' || (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public') || ' policies'
        ELSE '❌ Insufficient RLS policies'
    END as result;

-- Test basic queries
SELECT 
    'Basic Queries Check' as test_category,
    CASE 
        WHEN (SELECT COUNT(*) FROM categories WHERE is_active = true) > 0
        AND (SELECT COUNT(*) FROM products WHERE is_active = true) > 0
        THEN '✅ Basic queries working correctly'
        ELSE '❌ Issues with basic queries'
    END as result;

-- Check foreign key constraints
WITH fk_constraints AS (
    SELECT COUNT(*) as fk_count
    FROM information_schema.table_constraints
    WHERE constraint_schema = 'public'
    AND constraint_type = 'FOREIGN KEY'
)
SELECT 
    'Foreign Keys Check' as test_category,
    CASE 
        WHEN (SELECT fk_count FROM fk_constraints) >= 15
        THEN '✅ Foreign key constraints: ' || (SELECT fk_count FROM fk_constraints)
        ELSE '❌ Missing foreign key constraints'
    END as result;

-- Final summary
SELECT 
    '🎉 VERIFICATION COMPLETE' as test_category,
    'Database setup verification finished. Review results above.' as result;

-- Additional helpful queries for debugging
SELECT 
    '📊 DATABASE STATISTICS' as info_type,
    'Tables: ' || (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE') ||
    ' | Indexes: ' || (SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public') ||
    ' | Functions: ' || (SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema = 'public') ||
    ' | Policies: ' || (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public') as details;

-- Show table sizes (helpful for monitoring)
SELECT 
    '📈 TABLE SIZES' as info_type,
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 10;
