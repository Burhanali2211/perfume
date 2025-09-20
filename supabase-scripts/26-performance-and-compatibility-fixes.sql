-- ==========================================
-- 26-performance-and-compatibility-fixes.sql
-- Performance optimizations and compatibility fixes
-- ==========================================

-- ==========================================
-- 1. CREATE DATABASE VIEWS FOR COMPATIBILITY
-- ==========================================

-- Create view for orders with aliased columns for dashboard compatibility
CREATE OR REPLACE VIEW public.orders_dashboard AS
SELECT 
  id,
  order_number,
  user_id,
  guest_email,
  guest_name,
  subtotal,
  tax_amount,
  shipping_amount,
  discount_amount,
  total_amount as total, -- Alias for dashboard compatibility
  total_amount,
  status,
  payment_status,
  payment_method,
  payment_id,
  shipping_address,
  billing_address,
  notes,
  created_at,
  updated_at
FROM public.orders;

-- Create view for profiles with aliased columns
CREATE OR REPLACE VIEW public.profiles_dashboard AS
SELECT 
  id,
  email,
  full_name as name, -- Alias for dashboard compatibility
  full_name,
  avatar_url,
  role,
  phone,
  date_of_birth,
  is_active,
  email_verified,
  created_at,
  updated_at
FROM public.profiles;

-- ==========================================
-- 2. ADD PERFORMANCE INDEXES
-- ==========================================

-- Composite indexes for dashboard queries
CREATE INDEX IF NOT EXISTS idx_orders_status_created_at ON public.orders(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_user_status ON public.orders(user_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_date_status ON public.orders(DATE(created_at), status);

-- Product performance indexes
CREATE INDEX IF NOT EXISTS idx_products_category_featured ON public.products(category_id, is_featured) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_products_seller_active ON public.products(seller_id, is_active);
CREATE INDEX IF NOT EXISTS idx_products_price_range ON public.products(price) WHERE is_active = true;

-- Analytics and reporting indexes
CREATE INDEX IF NOT EXISTS idx_analytics_events_date_type ON public.analytics_events(DATE(created_at), event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_date ON public.analytics_events(user_id, created_at DESC);

-- Order items performance
CREATE INDEX IF NOT EXISTS idx_order_items_product_order ON public.order_items(product_id, order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_created ON public.order_items(order_id, created_at);

-- Reviews performance
CREATE INDEX IF NOT EXISTS idx_reviews_product_approved ON public.reviews(product_id, is_approved);
CREATE INDEX IF NOT EXISTS idx_reviews_user_created ON public.reviews(user_id, created_at DESC);

-- Cart and wishlist performance
CREATE INDEX IF NOT EXISTS idx_cart_items_user_created ON public.cart_items(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wishlist_items_user_created ON public.wishlist_items(user_id, created_at DESC);

-- ==========================================
-- 3. CREATE ENHANCED ANALYTICS FUNCTIONS
-- ==========================================

-- KPI Metrics Function (Enhanced)
CREATE OR REPLACE FUNCTION public.get_kpi_metrics(period_days INTEGER DEFAULT 30)
RETURNS JSON AS $$
DECLARE
    result JSON;
    start_date DATE;
    prev_start_date DATE;
BEGIN
    start_date := CURRENT_DATE - INTERVAL '1 day' * period_days;
    prev_start_date := start_date - INTERVAL '1 day' * period_days;
    
    SELECT json_build_object(
        'period_days', period_days,
        'current_period', json_build_object(
            'total_sales', (
                SELECT COALESCE(SUM(total_amount), 0) 
                FROM public.orders 
                WHERE created_at >= start_date AND status IN ('completed', 'delivered')
            ),
            'total_orders', (
                SELECT COUNT(*) 
                FROM public.orders 
                WHERE created_at >= start_date
            ),
            'new_customers', (
                SELECT COUNT(*) 
                FROM public.profiles 
                WHERE created_at >= start_date
            ),
            'average_order_value', (
                SELECT COALESCE(AVG(total_amount), 0) 
                FROM public.orders 
                WHERE created_at >= start_date AND status IN ('completed', 'delivered')
            )
        ),
        'previous_period', json_build_object(
            'total_sales', (
                SELECT COALESCE(SUM(total_amount), 0) 
                FROM public.orders 
                WHERE created_at >= prev_start_date AND created_at < start_date 
                AND status IN ('completed', 'delivered')
            ),
            'total_orders', (
                SELECT COUNT(*) 
                FROM public.orders 
                WHERE created_at >= prev_start_date AND created_at < start_date
            ),
            'new_customers', (
                SELECT COUNT(*) 
                FROM public.profiles 
                WHERE created_at >= prev_start_date AND created_at < start_date
            ),
            'average_order_value', (
                SELECT COALESCE(AVG(total_amount), 0) 
                FROM public.orders 
                WHERE created_at >= prev_start_date AND created_at < start_date 
                AND status IN ('completed', 'delivered')
            )
        ),
        'conversion_rate', (
            SELECT CASE 
                WHEN COUNT(DISTINCT user_id) > 0 
                THEN ROUND((COUNT(DISTINCT CASE WHEN status IN ('completed', 'delivered') THEN user_id END)::DECIMAL / COUNT(DISTINCT user_id)) * 100, 2)
                ELSE 0 
            END
            FROM public.orders 
            WHERE created_at >= start_date
        )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Sales Trends Function
CREATE OR REPLACE FUNCTION public.get_sales_trends(days INTEGER DEFAULT 30)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_agg(
        json_build_object(
            'date', date_series,
            'sales', COALESCE(daily_sales.total, 0),
            'orders', COALESCE(daily_sales.count, 0)
        ) ORDER BY date_series
    ) INTO result
    FROM (
        SELECT generate_series(
            CURRENT_DATE - INTERVAL '1 day' * days,
            CURRENT_DATE,
            INTERVAL '1 day'
        )::DATE as date_series
    ) dates
    LEFT JOIN (
        SELECT 
            DATE(created_at) as order_date,
            SUM(total_amount) as total,
            COUNT(*) as count
        FROM public.orders
        WHERE status IN ('completed', 'delivered')
        AND created_at >= CURRENT_DATE - INTERVAL '1 day' * days
        GROUP BY DATE(created_at)
    ) daily_sales ON dates.date_series = daily_sales.order_date;
    
    RETURN COALESCE(result, '[]'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Top Selling Products Function
CREATE OR REPLACE FUNCTION public.get_top_selling_products(limit_count INTEGER DEFAULT 10)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_agg(
        json_build_object(
            'id', p.id,
            'name', p.name,
            'sales_count', COALESCE(sales.total_quantity, 0),
            'revenue', COALESCE(sales.total_revenue, 0),
            'price', p.price,
            'image', CASE WHEN array_length(p.images, 1) > 0 THEN p.images[1] ELSE null END
        ) ORDER BY COALESCE(sales.total_quantity, 0) DESC
    ) INTO result
    FROM public.products p
    LEFT JOIN (
        SELECT 
            oi.product_id,
            SUM(oi.quantity) as total_quantity,
            SUM(oi.price * oi.quantity) as total_revenue
        FROM public.order_items oi
        JOIN public.orders o ON oi.order_id = o.id
        WHERE o.status IN ('completed', 'delivered')
        GROUP BY oi.product_id
    ) sales ON p.id = sales.product_id
    WHERE p.is_active = true
    ORDER BY COALESCE(sales.total_quantity, 0) DESC
    LIMIT limit_count;
    
    RETURN COALESCE(result, '[]'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 4. CREATE SYSTEM HEALTH MONITORING FUNCTION
-- ==========================================

CREATE OR REPLACE FUNCTION public.record_system_health()
RETURNS VOID AS $$
DECLARE
    db_size BIGINT;
    active_connections INTEGER;
    avg_query_time DECIMAL;
BEGIN
    -- Get database size
    SELECT pg_database_size(current_database()) INTO db_size;
    
    -- Get active connections
    SELECT count(*) INTO active_connections
    FROM pg_stat_activity 
    WHERE state = 'active';
    
    -- Record metrics
    INSERT INTO public.system_health_metrics (metric_name, metric_value, metric_unit, status)
    VALUES 
        ('database_size', db_size / 1024 / 1024, 'MB', 'healthy'),
        ('active_connections', active_connections, 'count', 
         CASE WHEN active_connections > 50 THEN 'warning' 
              WHEN active_connections > 100 THEN 'critical' 
              ELSE 'healthy' END),
        ('total_users', (SELECT COUNT(*) FROM public.profiles), 'count', 'healthy'),
        ('total_products', (SELECT COUNT(*) FROM public.products WHERE is_active = true), 'count', 'healthy'),
        ('total_orders', (SELECT COUNT(*) FROM public.orders), 'count', 'healthy');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 5. GRANT PERMISSIONS
-- ==========================================

-- Grant permissions on views
GRANT SELECT ON public.orders_dashboard TO anon, authenticated;
GRANT SELECT ON public.profiles_dashboard TO anon, authenticated;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.get_kpi_metrics(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_sales_trends(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_top_selling_products(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_system_health() TO service_role;

-- ==========================================
-- 6. VERIFICATION
-- ==========================================

SELECT 'Performance and compatibility fixes applied successfully' as status;

-- Test the new functions
SELECT 'Testing dashboard overview function...' as test;
SELECT public.get_dashboard_overview() as dashboard_data;

SELECT 'Testing KPI metrics function...' as test;
SELECT public.get_kpi_metrics(7) as kpi_data;

SELECT 'Performance optimization complete' as status;
