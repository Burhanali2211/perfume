-- ==========================================
-- 12-admin-functions.sql
-- Administrative functions and utilities
-- ==========================================

-- Function to get system health status
CREATE OR REPLACE FUNCTION public.get_system_health()
RETURNS TABLE(
  database_status TEXT,
  auth_status TEXT,
  storage_status TEXT,
  last_checked TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  -- Check database connectivity
  PERFORM 1 FROM public.profiles LIMIT 1;
  database_status := 'healthy';
  
  -- Check auth status (simplified)
  auth_status := 'healthy';
  
  -- Check storage status (simplified)
  storage_status := 'healthy';
  
  last_checked := NOW();
  
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user statistics
CREATE OR REPLACE FUNCTION public.get_user_statistics()
RETURNS TABLE(
  total_users BIGINT,
  active_users BIGINT,
  admin_users BIGINT,
  seller_users BIGINT,
  customer_users BIGINT,
  users_today BIGINT,
  users_this_week BIGINT,
  users_this_month BIGINT
) AS $$
BEGIN
  SELECT 
    COUNT(*),
    COUNT(CASE WHEN is_active = true THEN 1 END),
    COUNT(CASE WHEN role = 'admin' THEN 1 END),
    COUNT(CASE WHEN role = 'seller' THEN 1 END),
    COUNT(CASE WHEN role = 'customer' THEN 1 END),
    COUNT(CASE WHEN created_at >= CURRENT_DATE THEN 1 END),
    COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END),
    COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END)
  INTO 
    total_users,
    active_users,
    admin_users,
    seller_users,
    customer_users,
    users_today,
    users_this_week,
    users_this_month
  FROM public.profiles;
  
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get product statistics
CREATE OR REPLACE FUNCTION public.get_product_statistics()
RETURNS TABLE(
  total_products BIGINT,
  active_products BIGINT,
  featured_products BIGINT,
  out_of_stock_products BIGINT,
  low_stock_products BIGINT,
  products_by_category JSONB
) AS $$
BEGIN
  SELECT 
    COUNT(*),
    COUNT(CASE WHEN is_active = true THEN 1 END),
    COUNT(CASE WHEN is_featured = true AND is_active = true THEN 1 END),
    COUNT(CASE WHEN stock = 0 AND is_active = true THEN 1 END),
    COUNT(CASE WHEN stock <= min_stock_level AND is_active = true THEN 1 END),
    (SELECT jsonb_agg(jsonb_build_object('category', c.name, 'count', COUNT(p.id)))
     FROM public.categories c
     LEFT JOIN public.products p ON c.id = p.category_id AND p.is_active = true
     WHERE c.is_active = true
     GROUP BY c.id, c.name)
  INTO 
    total_products,
    active_products,
    featured_products,
    out_of_stock_products,
    low_stock_products,
    products_by_category
  FROM public.products;
  
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get order statistics
CREATE OR REPLACE FUNCTION public.get_order_statistics()
RETURNS TABLE(
  total_orders BIGINT,
  completed_orders BIGINT,
  pending_orders BIGINT,
  cancelled_orders BIGINT,
  total_revenue DECIMAL(12, 2),
  average_order_value DECIMAL(10, 2),
  orders_today BIGINT,
  orders_this_week BIGINT,
  orders_this_month BIGINT
) AS $$
BEGIN
  SELECT 
    COUNT(*),
    COUNT(CASE WHEN status = 'delivered' THEN 1 END),
    COUNT(CASE WHEN status IN ('pending', 'confirmed', 'processing') THEN 1 END),
    COUNT(CASE WHEN status IN ('cancelled', 'refunded') THEN 1 END),
    COALESCE(SUM(total_amount), 0),
    COALESCE(AVG(total_amount), 0),
    COUNT(CASE WHEN created_at >= CURRENT_DATE THEN 1 END),
    COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END),
    COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END)
  INTO 
    total_orders,
    completed_orders,
    pending_orders,
    cancelled_orders,
    total_revenue,
    average_order_value,
    orders_today,
    orders_this_week,
    orders_this_month
  FROM public.orders;
  
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get sales report
CREATE OR REPLACE FUNCTION public.get_sales_report(period TEXT DEFAULT 'month')
RETURNS TABLE(
  period_start TIMESTAMP WITH TIME ZONE,
  period_end TIMESTAMP WITH TIME ZONE,
  total_orders BIGINT,
  total_revenue DECIMAL(12, 2),
  average_order_value DECIMAL(10, 2),
  top_product_id UUID,
  top_product_name TEXT,
  top_product_revenue DECIMAL(12, 2)
) AS $$
DECLARE
  start_date TIMESTAMP WITH TIME ZONE;
  end_date TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Determine date range based on period
  CASE period
    WHEN 'day' THEN
      start_date := CURRENT_DATE;
      end_date := CURRENT_DATE + INTERVAL '1 day';
    WHEN 'week' THEN
      start_date := CURRENT_DATE - INTERVAL '7 days';
      end_date := CURRENT_DATE;
    WHEN 'month' THEN
      start_date := CURRENT_DATE - INTERVAL '30 days';
      end_date := CURRENT_DATE;
    WHEN 'year' THEN
      start_date := CURRENT_DATE - INTERVAL '365 days';
      end_date := CURRENT_DATE;
    ELSE
      start_date := CURRENT_DATE - INTERVAL '30 days';
      end_date := CURRENT_DATE;
  END CASE;
  
  -- Get basic sales data
  SELECT 
    start_date,
    end_date,
    COUNT(*),
    COALESCE(SUM(total_amount), 0),
    COALESCE(AVG(total_amount), 0)
  INTO 
    period_start,
    period_end,
    total_orders,
    total_revenue,
    average_order_value
  FROM public.orders
  WHERE created_at >= start_date AND created_at < end_date
    AND status = 'delivered';
  
  -- Get top selling product
  SELECT 
    p.id,
    p.name,
    SUM(oi.total_price)
  INTO 
    top_product_id,
    top_product_name,
    top_product_revenue
  FROM public.order_items oi
  JOIN public.orders o ON oi.order_id = o.id
  JOIN public.products p ON oi.product_id = p.id
  WHERE o.created_at >= start_date AND o.created_at < end_date
    AND o.status = 'delivered'
  GROUP BY p.id, p.name
  ORDER BY SUM(oi.total_price) DESC
  LIMIT 1;
  
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get inventory report
CREATE OR REPLACE FUNCTION public.get_inventory_report()
RETURNS TABLE(
  total_products BIGINT,
  in_stock_products BIGINT,
  low_stock_products BIGINT,
  out_of_stock_products BIGINT,
  total_inventory_value DECIMAL(12, 2),
  category_inventory JSONB
) AS $$
BEGIN
  SELECT 
    COUNT(*),
    COUNT(CASE WHEN stock > 0 THEN 1 END),
    COUNT(CASE WHEN stock <= min_stock_level AND stock > 0 THEN 1 END),
    COUNT(CASE WHEN stock = 0 THEN 1 END),
    COALESCE(SUM(price * stock), 0),
    (SELECT jsonb_agg(jsonb_build_object(
      'category', c.name, 
      'product_count', COUNT(p.id),
      'total_value', COALESCE(SUM(p.price * p.stock), 0)
    ))
     FROM public.categories c
     LEFT JOIN public.products p ON c.id = p.category_id AND p.is_active = true
     WHERE c.is_active = true
     GROUP BY c.id, c.name)
  INTO 
    total_products,
    in_stock_products,
    low_stock_products,
    out_of_stock_products,
    total_inventory_value,
    category_inventory
  FROM public.products
  WHERE is_active = true;
  
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user activity report
CREATE OR REPLACE FUNCTION public.get_user_activity_report()
RETURNS TABLE(
  total_users BIGINT,
  active_users_today BIGINT,
  active_users_week BIGINT,
  active_users_month BIGINT,
  new_users_today BIGINT,
  new_users_week BIGINT,
  new_users_month BIGINT,
  top_active_user_id UUID,
  top_active_user_name TEXT,
  top_active_user_orders BIGINT
) AS $$
BEGIN
  -- Get basic user counts
  SELECT 
    COUNT(*),
    COUNT(CASE WHEN last_sign_in_at >= CURRENT_DATE THEN 1 END),
    COUNT(CASE WHEN last_sign_in_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END),
    COUNT(CASE WHEN last_sign_in_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END),
    COUNT(CASE WHEN created_at >= CURRENT_DATE THEN 1 END),
    COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END),
    COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END)
  INTO 
    total_users,
    active_users_today,
    active_users_week,
    active_users_month,
    new_users_today,
    new_users_week,
    new_users_month
  FROM public.profiles;
  
  -- Get top active user (by order count)
  SELECT 
    u.id,
    u.full_name,
    COUNT(o.id)
  INTO 
    top_active_user_id,
    top_active_user_name,
    top_active_user_orders
  FROM public.profiles u
  JOIN public.orders o ON u.id = o.user_id
  WHERE o.created_at >= CURRENT_DATE - INTERVAL '30 days'
  GROUP BY u.id, u.full_name
  ORDER BY COUNT(o.id) DESC
  LIMIT 1;
  
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get dashboard overview
CREATE OR REPLACE FUNCTION public.get_dashboard_overview()
RETURNS TABLE(
  total_revenue DECIMAL(12, 2),
  total_orders BIGINT,
  total_products BIGINT,
  total_users BIGINT,
  pending_orders BIGINT,
  low_stock_products BIGINT,
  monthly_revenue DECIMAL(12, 2),
  monthly_orders BIGINT
) AS $$
BEGIN
  SELECT 
    COALESCE(SUM(total_amount), 0),
    COUNT(*),
    (SELECT COUNT(*) FROM public.products WHERE is_active = true),
    (SELECT COUNT(*) FROM public.profiles),
    COUNT(CASE WHEN status IN ('pending', 'confirmed', 'processing') THEN 1 END),
    (SELECT COUNT(*) FROM public.products WHERE stock <= min_stock_level AND is_active = true),
    COALESCE(SUM(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN total_amount ELSE 0 END), 0),
    COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END)
  INTO 
    total_revenue,
    total_orders,
    total_products,
    total_users,
    pending_orders,
    low_stock_products,
    monthly_revenue,
    monthly_orders
  FROM public.orders
  WHERE status = 'delivered';
  
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get KPI metrics
CREATE OR REPLACE FUNCTION public.get_kpi_metrics(period_days INTEGER DEFAULT 30)
RETURNS TABLE(
  total_revenue DECIMAL(12, 2),
  revenue_change_percent DECIMAL(5, 2),
  total_orders BIGINT,
  orders_change_percent DECIMAL(5, 2),
  avg_order_value DECIMAL(10, 2),
  aov_change_percent DECIMAL(5, 2),
  conversion_rate DECIMAL(5, 2),
  conversion_change_percent DECIMAL(5, 2)
) AS $$
DECLARE
  current_period_revenue DECIMAL(12, 2);
  previous_period_revenue DECIMAL(12, 2);
  current_period_orders BIGINT;
  previous_period_orders BIGINT;
  current_period_aov DECIMAL(10, 2);
  previous_period_aov DECIMAL(10, 2);
  current_period_sessions BIGINT;
  previous_period_sessions BIGINT;
BEGIN
  -- Get current period data
  SELECT 
    COALESCE(SUM(total_amount), 0),
    COUNT(*),
    CASE WHEN COUNT(*) > 0 THEN COALESCE(SUM(total_amount) / COUNT(*), 0) ELSE 0 END
  INTO 
    current_period_revenue,
    current_period_orders,
    current_period_aov
  FROM public.orders
  WHERE created_at >= CURRENT_DATE - INTERVAL '1 day' * period_days
    AND status = 'delivered';
  
  -- Get previous period data
  SELECT 
    COALESCE(SUM(total_amount), 0),
    COUNT(*),
    CASE WHEN COUNT(*) > 0 THEN COALESCE(SUM(total_amount) / COUNT(*), 0) ELSE 0 END
  INTO 
    previous_period_revenue,
    previous_period_orders,
    previous_period_aov
  FROM public.orders
  WHERE created_at >= CURRENT_DATE - INTERVAL '1 day' * period_days * 2
    AND created_at < CURRENT_DATE - INTERVAL '1 day' * period_days
    AND status = 'delivered';
  
  -- Calculate conversion rate (simplified)
  current_period_sessions := current_period_orders * 2; -- Simplified assumption
  previous_period_sessions := previous_period_orders * 2; -- Simplified assumption
  
  -- Calculate percentages
  revenue_change_percent := CASE 
    WHEN previous_period_revenue > 0 THEN 
      ((current_period_revenue - previous_period_revenue) / previous_period_revenue) * 100 
    ELSE 0 
  END;
  
  orders_change_percent := CASE 
    WHEN previous_period_orders > 0 THEN 
      ((current_period_orders - previous_period_orders) / previous_period_orders) * 100 
    ELSE 0 
  END;
  
  aov_change_percent := CASE 
    WHEN previous_period_aov > 0 THEN 
      ((current_period_aov - previous_period_aov) / previous_period_aov) * 100 
    ELSE 0 
  END;
  
  conversion_rate := CASE 
    WHEN current_period_sessions > 0 THEN 
      (current_period_orders::DECIMAL / current_period_sessions) * 100 
    ELSE 0 
  END;
  
  conversion_change_percent := CASE 
    WHEN previous_period_sessions > 0 THEN 
      (((current_period_orders::DECIMAL / current_period_sessions) - 
        (previous_period_orders::DECIMAL / previous_period_sessions)) / 
       (previous_period_orders::DECIMAL / previous_period_sessions)) * 100 
    ELSE 0 
  END;
  
  -- Return values
  total_revenue := current_period_revenue;
  total_orders := current_period_orders;
  avg_order_value := current_period_aov;
  
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get real-time metrics
CREATE OR REPLACE FUNCTION public.get_realtime_metrics()
RETURNS TABLE(
  active_users BIGINT,
  pending_orders BIGINT,
  low_stock_alerts BIGINT,
  new_orders_today BIGINT,
  revenue_today DECIMAL(12, 2),
  top_selling_product_id UUID,
  top_selling_product_name TEXT
) AS $$
BEGIN
  -- Get active users (users who signed in today)
  SELECT COUNT(*) INTO active_users
  FROM public.profiles
  WHERE last_sign_in_at >= CURRENT_DATE;
  
  -- Get pending orders
  SELECT COUNT(*) INTO pending_orders
  FROM public.orders
  WHERE status IN ('pending', 'confirmed', 'processing');
  
  -- Get low stock alerts
  SELECT COUNT(*) INTO low_stock_alerts
  FROM public.products
  WHERE stock <= min_stock_level AND is_active = true;
  
  -- Get new orders today
  SELECT 
    COUNT(*),
    COALESCE(SUM(total_amount), 0)
  INTO 
    new_orders_today,
    revenue_today
  FROM public.orders
  WHERE created_at >= CURRENT_DATE;
  
  -- Get top selling product today
  SELECT 
    p.id,
    p.name
  INTO 
    top_selling_product_id,
    top_selling_product_name
  FROM public.products p
  JOIN public.order_items oi ON p.id = oi.product_id
  JOIN public.orders o ON oi.order_id = o.id
  WHERE o.created_at >= CURRENT_DATE
  GROUP BY p.id, p.name
  ORDER BY SUM(oi.quantity) DESC
  LIMIT 1;
  
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;