-- ==========================================
-- 24-comprehensive-console-errors-fix.sql
-- Comprehensive fix for all console errors
-- ==========================================

-- ==========================================
-- 1. Create Missing Database Functions
-- ==========================================

-- Dashboard Overview Function
CREATE OR REPLACE FUNCTION public.get_dashboard_overview()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_products', (SELECT COUNT(*) FROM public.products WHERE is_active = true),
        'total_orders', (SELECT COUNT(*) FROM public.orders),
        'total_users', (SELECT COUNT(*) FROM public.profiles WHERE is_active = true),
        'total_revenue', (SELECT COALESCE(SUM(total_amount), 0) FROM public.orders WHERE status = 'completed'),
        'pending_orders', (SELECT COUNT(*) FROM public.orders WHERE status = 'pending'),
        'low_stock_products', (SELECT COUNT(*) FROM public.products WHERE stock <= min_stock_level AND is_active = true),
        'recent_orders', (
            SELECT json_agg(
                json_build_object(
                    'id', o.id,
                    'customer_name', p.full_name,
                    'total_amount', o.total_amount,
                    'status', o.status,
                    'created_at', o.created_at
                )
            )
            FROM public.orders o
            LEFT JOIN public.profiles p ON o.user_id = p.id
            ORDER BY o.created_at DESC
            LIMIT 5
        ),
        'top_products', (
            SELECT json_agg(
                json_build_object(
                    'id', pr.id,
                    'name', pr.name,
                    'sales_count', COALESCE(sales.count, 0),
                    'revenue', COALESCE(sales.revenue, 0)
                )
            )
            FROM public.products pr
            LEFT JOIN (
                SELECT 
                    oi.product_id,
                    COUNT(*) as count,
                    SUM(oi.price * oi.quantity) as revenue
                FROM public.order_items oi
                JOIN public.orders o ON oi.order_id = o.id
                WHERE o.status = 'completed'
                GROUP BY oi.product_id
            ) sales ON pr.id = sales.product_id
            WHERE pr.is_active = true
            ORDER BY COALESCE(sales.count, 0) DESC
            LIMIT 5
        )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- KPI Metrics Function
CREATE OR REPLACE FUNCTION public.get_kpi_metrics(period_days INTEGER DEFAULT 30)
RETURNS JSON AS $$
DECLARE
    result JSON;
    start_date DATE;
BEGIN
    start_date := CURRENT_DATE - INTERVAL '1 day' * period_days;
    
    SELECT json_build_object(
        'period_days', period_days,
        'total_sales', (
            SELECT COALESCE(SUM(total_amount), 0) 
            FROM public.orders 
            WHERE created_at >= start_date AND status = 'completed'
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
            WHERE created_at >= start_date AND status = 'completed'
        ),
        'conversion_rate', (
            SELECT CASE 
                WHEN COUNT(DISTINCT user_id) > 0 
                THEN (COUNT(DISTINCT CASE WHEN status = 'completed' THEN user_id END)::FLOAT / COUNT(DISTINCT user_id)::FLOAT) * 100
                ELSE 0 
            END
            FROM public.orders 
            WHERE created_at >= start_date
        ),
        'top_selling_categories', (
            SELECT json_agg(
                json_build_object(
                    'category_name', c.name,
                    'sales_count', cat_sales.count,
                    'revenue', cat_sales.revenue
                )
            )
            FROM public.categories c
            JOIN (
                SELECT 
                    p.category_id,
                    COUNT(*) as count,
                    SUM(oi.price * oi.quantity) as revenue
                FROM public.order_items oi
                JOIN public.orders o ON oi.order_id = o.id
                JOIN public.products p ON oi.product_id = p.id
                WHERE o.created_at >= start_date AND o.status = 'completed'
                GROUP BY p.category_id
                ORDER BY COUNT(*) DESC
                LIMIT 5
            ) cat_sales ON c.id = cat_sales.category_id
        )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Realtime Metrics Function
CREATE OR REPLACE FUNCTION public.get_realtime_metrics()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'active_users_today', (
            SELECT COUNT(DISTINCT user_id) 
            FROM public.analytics_events 
            WHERE DATE(created_at) = CURRENT_DATE
        ),
        'orders_today', (
            SELECT COUNT(*) 
            FROM public.orders 
            WHERE DATE(created_at) = CURRENT_DATE
        ),
        'revenue_today', (
            SELECT COALESCE(SUM(total_amount), 0) 
            FROM public.orders 
            WHERE DATE(created_at) = CURRENT_DATE AND status = 'completed'
        ),
        'pending_orders', (
            SELECT COUNT(*) 
            FROM public.orders 
            WHERE status = 'pending'
        ),
        'low_stock_alerts', (
            SELECT COUNT(*) 
            FROM public.products 
            WHERE stock <= min_stock_level AND is_active = true
        ),
        'recent_activity', (
            SELECT json_agg(
                json_build_object(
                    'type', 'order',
                    'description', 'New order #' || o.id,
                    'amount', o.total_amount,
                    'time', o.created_at
                )
            )
            FROM public.orders o
            WHERE o.created_at >= NOW() - INTERVAL '1 hour'
            ORDER BY o.created_at DESC
            LIMIT 10
        )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Set Config Function (for RLS bypass in direct login mode)
CREATE OR REPLACE FUNCTION public.set_config(setting_name TEXT, setting_value TEXT)
RETURNS TEXT AS $$
BEGIN
    -- Only allow specific configuration settings for security
    IF setting_name IN ('app.current_user_id', 'app.user_role', 'app.direct_login_mode') THEN
        PERFORM set_config(setting_name, setting_value, true);
        RETURN 'Configuration set successfully';
    ELSE
        RAISE EXCEPTION 'Configuration setting not allowed: %', setting_name;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 2. Create Missing Tables
-- ==========================================

-- Order Tracking Table
CREATE TABLE IF NOT EXISTS public.order_tracking (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL,
    location TEXT,
    notes TEXT,
    tracking_number VARCHAR(100),
    carrier VARCHAR(100),
    estimated_delivery DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for order_tracking
CREATE INDEX IF NOT EXISTS idx_order_tracking_order_id ON public.order_tracking(order_id);
CREATE INDEX IF NOT EXISTS idx_order_tracking_status ON public.order_tracking(status);
CREATE INDEX IF NOT EXISTS idx_order_tracking_created_at ON public.order_tracking(created_at);

-- ==========================================
-- 3. Fix RLS Policies for Direct Login Mode
-- ==========================================

-- Update products RLS policy to allow direct login mode
DROP POLICY IF EXISTS "Users can insert products" ON public.products;
CREATE POLICY "Users can insert products" ON public.products
    FOR INSERT WITH CHECK (
        -- Allow if user is authenticated
        auth.uid() IS NOT NULL
        OR
        -- Allow in direct login mode (check for app.direct_login_mode config)
        current_setting('app.direct_login_mode', true) = 'true'
        OR
        -- Allow if seller_id matches current user
        seller_id = auth.uid()::text
        OR
        -- Allow if user is admin
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Update profiles RLS policy for direct login mode
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
CREATE POLICY "Users can view all profiles" ON public.profiles
    FOR SELECT USING (
        -- Allow if authenticated
        auth.uid() IS NOT NULL
        OR
        -- Allow in direct login mode
        current_setting('app.direct_login_mode', true) = 'true'
        OR
        -- Allow viewing own profile
        id = auth.uid()
    );

-- ==========================================
-- 4. Grant Permissions
-- ==========================================

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.get_dashboard_overview() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_kpi_metrics(INTEGER) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_realtime_metrics() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.set_config(TEXT, TEXT) TO authenticated, anon;

-- Grant permissions on order_tracking table
GRANT ALL ON public.order_tracking TO authenticated;
GRANT SELECT ON public.order_tracking TO anon;

-- ==========================================
-- 5. Insert Sample Order Tracking Data
-- ==========================================

-- Insert sample tracking data for existing orders
INSERT INTO public.order_tracking (order_id, status, location, notes, tracking_number, carrier)
SELECT 
    o.id,
    CASE 
        WHEN o.status = 'completed' THEN 'delivered'
        WHEN o.status = 'processing' THEN 'in_transit'
        WHEN o.status = 'pending' THEN 'confirmed'
        ELSE 'pending'
    END,
    'Distribution Center',
    'Order processed successfully',
    'TRK' || LPAD((ROW_NUMBER() OVER (ORDER BY o.created_at))::TEXT, 8, '0'),
    'Express Delivery'
FROM public.orders o
WHERE NOT EXISTS (
    SELECT 1 FROM public.order_tracking ot WHERE ot.order_id = o.id
)
LIMIT 10;

-- ==========================================
-- Verification Queries
-- ==========================================

-- Test the functions
SELECT 'Dashboard Overview Function' as test, get_dashboard_overview() IS NOT NULL as success;
SELECT 'KPI Metrics Function' as test, get_kpi_metrics(30) IS NOT NULL as success;
SELECT 'Realtime Metrics Function' as test, get_realtime_metrics() IS NOT NULL as success;

-- Verify tables exist
SELECT 'Order Tracking Table' as test, 
       EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'order_tracking') as success;

-- Check RLS policies
SELECT 'Products RLS Policy' as test, 
       EXISTS(SELECT 1 FROM pg_policies WHERE tablename = 'products' AND policyname = 'Users can insert products') as success;
