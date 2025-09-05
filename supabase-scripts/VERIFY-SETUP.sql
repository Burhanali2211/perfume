-- ==========================================
-- VERIFY-SETUP.sql
-- Verification script to check if database setup is complete
-- ==========================================

-- Check if all required tables exist
SELECT 
  table_name,
  CASE 
    WHEN table_name IN (
      'profiles', 'categories', 'products', 'product_variants', 
      'cart_items', 'wishlist_items', 'orders', 'order_items', 
      'reviews', 'coupons', 'addresses', 'user_preferences',
      'user_security_settings', 'payment_methods', 'inventory_transactions',
      'low_stock_alerts', 'order_tracking', 'coupon_usage', 'analytics_events'
    ) THEN 'REQUIRED'
    ELSE 'ADDITIONAL'
  END as table_status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Check if RLS is enabled on required tables
SELECT 
  table_name,
  CASE 
    WHEN table_name IN (
      'profiles', 'categories', 'products', 'product_variants', 
      'cart_items', 'wishlist_items', 'orders', 'order_items', 
      'reviews', 'coupons', 'addresses', 'user_preferences',
      'user_security_settings', 'payment_methods', 'inventory_transactions',
      'low_stock_alerts', 'order_tracking', 'coupon_usage', 'analytics_events'
    ) THEN 'REQUIRED'
    ELSE 'ADDITIONAL'
  END as table_status,
  CASE 
    WHEN relrowsecurity THEN 'ENABLED'
    ELSE 'DISABLED'
  END as rls_status
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
LEFT JOIN information_schema.tables t ON t.table_name = c.relname AND t.table_schema = n.nspname
WHERE n.nspname = 'public' 
  AND c.relkind = 'r'
  AND t.table_type = 'BASE TABLE'
ORDER BY c.relname;

-- Check if required functions exist
SELECT 
  proname as function_name,
  CASE 
    WHEN proname IN (
      'handle_new_user', 'is_admin', 'is_seller', 'is_customer',
      'update_updated_at_column', 'generate_category_slug', 'set_category_slug',
      'set_product_slug', 'update_product_rating', 'update_product_stock',
      'calculate_cart_item_total', 'add_to_cart', 'clear_cart',
      'get_user_wishlist', 'is_product_in_wishlist', 'generate_order_number',
      'update_stock_on_order_confirmation', 'increment_review_helpful',
      'has_user_purchased_product', 'set_verified_purchase_status',
      'validate_coupon', 'apply_coupon_to_order', 'record_analytics_event',
      'get_dashboard_analytics', 'get_sales_trends', 'get_top_selling_products',
      'get_system_health', 'get_user_statistics', 'get_product_statistics',
      'get_order_statistics', 'get_sales_report', 'get_inventory_report',
      'get_user_activity_report', 'can_access_resource', 'sanitize_input',
      'log_security_event', 'is_valid_email', 'is_valid_phone', 'is_valid_pincode',
      'check_rate_limit'
    ) THEN 'REQUIRED'
    ELSE 'ADDITIONAL'
  END as function_status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
ORDER BY proname;

-- Check if required indexes exist
SELECT 
  tablename,
  indexname,
  CASE 
    WHEN indexname IN (
      'idx_profiles_role', 'idx_profiles_email', 'idx_categories_slug',
      'idx_products_category_id', 'idx_products_seller_id', 'idx_products_slug',
      'idx_cart_items_user_id', 'idx_orders_user_id', 'idx_reviews_product_id',
      'idx_coupons_code', 'idx_addresses_user_id'
    ) THEN 'REQUIRED'
    ELSE 'ADDITIONAL'
  END as index_status
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Check if required policies exist
SELECT 
  polname as policy_name,
  relname as table_name,
  CASE 
    WHEN polname IN (
      'Public profiles are viewable by everyone', 
      'Users can insert their own profile',
      'Users can update their own profile',
      'Admins can view all profiles',
      'Admins can update all profiles',
      'Active products are viewable by everyone',
      'Sellers can insert their own products',
      'Sellers can update their own products',
      'Sellers can delete their own products',
      'Users can view their own cart items',
      'Users can insert their own cart items',
      'Approved reviews are viewable by everyone',
      'Users can insert their own reviews',
      'Active coupons are viewable by everyone',
      'Admins can manage all coupons'
    ) THEN 'REQUIRED'
    ELSE 'ADDITIONAL'
  END as policy_status
FROM pg_policy p
JOIN pg_class c ON p.polrelid = c.oid
WHERE c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
ORDER BY polname;

-- Check if sample data exists
SELECT 
  'categories' as table_name,
  COUNT(*) as record_count
FROM public.categories
UNION ALL
SELECT 
  'products' as table_name,
  COUNT(*) as record_count
FROM public.products
UNION ALL
SELECT 
  'profiles' as table_name,
  COUNT(*) as record_count
FROM public.profiles
ORDER BY table_name;

-- Summary report
SELECT 
  'Database Setup Verification Complete' as status,
  'All required tables, functions, indexes, and policies should be present' as message;