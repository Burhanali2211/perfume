-- ==========================================
-- ADD MISSING ADMIN FUNCTIONS
-- Adds the missing database functions required by the admin dashboard
-- ==========================================

-- Function to get dashboard overview
CREATE OR REPLACE FUNCTION public.get_dashboard_overview()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_products', (SELECT COUNT(*) FROM public.products WHERE is_active = true),
        'total_orders', (SELECT COUNT(*) FROM public.orders),
        'total_users', (SELECT COUNT(*) FROM public.profiles WHERE is_active = true),
        'total_revenue', (SELECT COALESCE(SUM(total_amount), 0) FROM public.orders WHERE status IN ('completed', 'delivered')),
        'pending_orders', (SELECT COUNT(*) FROM public.orders WHERE status = 'pending'),
        'low_stock_products', (SELECT COUNT(*) FROM public.products WHERE stock <= min_stock_level AND is_active = true),
        'new_users_today', (SELECT COUNT(*) FROM public.profiles WHERE DATE(created_at) = CURRENT_DATE),
        'orders_today', (SELECT COUNT(*) FROM public.orders WHERE DATE(created_at) = CURRENT_DATE),
        'revenue_today', (SELECT COALESCE(SUM(total_amount), 0) FROM public.orders WHERE DATE(created_at) = CURRENT_DATE AND status IN ('completed', 'delivered')),
        'recent_orders', (
            SELECT COALESCE(json_agg(
                json_build_object(
                    'id', o.id,
                    'customer_name', COALESCE(p.full_name, o.guest_name, 'Guest'),
                    'total_amount', o.total_amount,
                    'status', o.status,
                    'created_at', o.created_at
                )
                ORDER BY o.created_at DESC
            ), '[]'::json)
            FROM (
                SELECT id, user_id, guest_name, total_amount, status, created_at
                FROM public.orders
                ORDER BY created_at DESC
                LIMIT 5
            ) o
            LEFT JOIN public.profiles p ON o.user_id = p.id
        )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get KPI metrics
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
        ),
        'conversion_rate', (
            SELECT CASE 
                WHEN COUNT(DISTINCT user_id) > 0 
                THEN (COUNT(DISTINCT CASE WHEN status IN ('completed', 'delivered') THEN user_id END)::FLOAT / COUNT(DISTINCT user_id)::FLOAT) * 100
                ELSE 0 
            END
            FROM public.orders 
            WHERE created_at >= start_date
        )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get real-time metrics
CREATE OR REPLACE FUNCTION public.get_realtime_metrics()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'active_users_today', 0, -- Placeholder as we don't have analytics events table
        'orders_today', (
            SELECT COUNT(*) 
            FROM public.orders 
            WHERE DATE(created_at) = CURRENT_DATE
        ),
        'revenue_today', (
            SELECT COALESCE(SUM(total_amount), 0) 
            FROM public.orders 
            WHERE DATE(created_at) = CURRENT_DATE AND status IN ('completed', 'delivered')
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
        )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions on functions to authenticated users
GRANT EXECUTE ON FUNCTION public.get_dashboard_overview() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_kpi_metrics(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_realtime_metrics() TO authenticated;

-- Verification queries
SELECT 'get_dashboard_overview function created successfully' as status;
SELECT 'get_kpi_metrics function created successfully' as status;
SELECT 'get_realtime_metrics function created successfully' as status;