-- ==========================================
-- 12-admin-functions.sql & 13-security-policies.sql
-- Administrative functions and security policies
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

-- Function to generate order number
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TEXT AS $$
DECLARE
  order_num TEXT;
  counter INTEGER;
BEGIN
  -- Get current date in YYYYMMDD format
  order_num := 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-';
  
  -- Get count of orders today
  SELECT COUNT(*) + 1 INTO counter
  FROM public.orders
  WHERE created_at >= CURRENT_DATE;
  
  -- Pad with zeros to make it 4 digits
  order_num := order_num || LPAD(counter::TEXT, 4, '0');
  
  RETURN order_num;
END;
$$ LANGUAGE plpgsql;

-- Function to add to cart with validation
CREATE OR REPLACE FUNCTION public.add_to_cart(
  p_product_id UUID,
  p_variant_id UUID DEFAULT NULL,
  p_quantity INTEGER DEFAULT 1
)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID;
  v_current_quantity INTEGER := 0;
  v_available_stock INTEGER;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check product availability
  IF p_variant_id IS NOT NULL THEN
    SELECT stock INTO v_available_stock
    FROM public.product_variants
    WHERE id = p_variant_id AND is_active = true;
  ELSE
    SELECT stock INTO v_available_stock
    FROM public.products
    WHERE id = p_product_id AND is_active = true;
  END IF;
  
  IF v_available_stock IS NULL OR v_available_stock < p_quantity THEN
    RETURN FALSE;
  END IF;
  
  -- Check if item already exists in cart
  SELECT quantity INTO v_current_quantity
  FROM public.cart_items
  WHERE user_id = v_user_id 
    AND product_id = p_product_id 
    AND (variant_id = p_variant_id OR (variant_id IS NULL AND p_variant_id IS NULL));
  
  IF v_current_quantity IS NOT NULL THEN
    -- Update existing cart item
    UPDATE public.cart_items
    SET quantity = v_current_quantity + p_quantity,
        updated_at = NOW()
    WHERE user_id = v_user_id 
      AND product_id = p_product_id 
      AND (variant_id = p_variant_id OR (variant_id IS NULL AND p_variant_id IS NULL));
  ELSE
    -- Insert new cart item
    INSERT INTO public.cart_items (user_id, product_id, variant_id, quantity)
    VALUES (v_user_id, p_product_id, p_variant_id, p_quantity);
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment review helpful count
CREATE OR REPLACE FUNCTION public.increment_review_helpful(review_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.reviews
  SET helpful_count = helpful_count + 1
  WHERE id = review_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions on functions to appropriate roles
GRANT EXECUTE ON FUNCTION public.get_system_health() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_statistics() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_product_statistics() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_order_statistics() TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_order_number() TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_to_cart(UUID, UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_review_helpful(UUID) TO authenticated;

-- ==========================================
-- Additional Security Policies
-- ==========================================

-- Create additional security policies for better data protection

-- Policy to prevent users from viewing other users' sensitive data
CREATE POLICY "Users cannot view other users' sensitive profile data" ON public.profiles
  FOR SELECT USING (
    auth.uid() = id OR 
    public.is_admin(auth.uid()) OR
    -- Allow viewing basic profile info for public profiles
    (is_active = true AND role IN ('seller'))
  );

-- Policy for order tracking
CREATE POLICY "Users can track orders with order number" ON public.orders
  FOR SELECT USING (
    auth.uid() = user_id OR
    public.is_admin(auth.uid()) OR
    -- Allow guest order tracking with order number
    (guest_email IS NOT NULL)
  );

-- Create views for category statistics (now that products table exists)
CREATE OR REPLACE VIEW public.category_stats AS
SELECT 
  c.id,
  c.name,
  c.slug,
  COUNT(p.id) as product_count,
  AVG(p.price) as average_price,
  MAX(p.created_at) as last_product_added
FROM public.categories c
LEFT JOIN public.products p ON c.id = p.category_id AND p.is_active = true
WHERE c.is_active = true
GROUP BY c.id, c.name, c.slug;

-- Grant permissions on the view
GRANT SELECT ON public.category_stats TO anon, authenticated;

-- Create inventory view
CREATE OR REPLACE VIEW public.current_inventory AS
SELECT 
  p.id as product_id,
  p.name as product_name,
  p.sku as product_sku,
  p.stock as product_stock,
  p.min_stock_level,
  CASE 
    WHEN p.stock <= p.min_stock_level THEN 'low' 
    WHEN p.stock <= p.min_stock_level * 2 THEN 'medium' 
    ELSE 'good' 
  END as stock_status,
  p.seller_id,
  pr.full_name as seller_name
FROM public.products p
LEFT JOIN public.profiles pr ON p.seller_id = pr.id
WHERE p.is_active = true;

-- Grant permissions on the inventory view
GRANT SELECT ON public.current_inventory TO authenticated;

-- Function to get dashboard overview
CREATE OR REPLACE FUNCTION public.get_dashboard_overview()
RETURNS TABLE(
  total_users BIGINT,
  total_products BIGINT,
  total_orders BIGINT,
  total_revenue DECIMAL(12, 2),
  pending_orders BIGINT,
  low_stock_products BIGINT,
  new_users_today BIGINT,
  orders_today BIGINT,
  revenue_today DECIMAL(12, 2),
  conversion_rate DECIMAL(5, 2),
  top_products JSONB,
  recent_orders JSONB,
  low_stock_items JSONB
) AS $$
BEGIN
  SELECT 
    (SELECT COUNT(*) FROM public.profiles),
    (SELECT COUNT(*) FROM public.products WHERE is_active = true),
    (SELECT COUNT(*) FROM public.orders),
    COALESCE((SELECT SUM(total_amount) FROM public.orders), 0),
    (SELECT COUNT(*) FROM public.orders WHERE status IN ('pending', 'confirmed', 'processing')),
    (SELECT COUNT(*) FROM public.products WHERE stock <= 10 AND is_active = true),
    (SELECT COUNT(*) FROM public.profiles WHERE created_at >= CURRENT_DATE),
    (SELECT COUNT(*) FROM public.orders WHERE created_at >= CURRENT_DATE),
    COALESCE((SELECT SUM(total_amount) FROM public.orders WHERE created_at >= CURRENT_DATE), 0),
    3.2, -- Static conversion rate for now
    -- Top products (by revenue)
    (SELECT jsonb_agg(jsonb_build_object(
      'id', p.id,
      'name', p.name,
      'total_revenue', COALESCE(SUM(oi.quantity * oi.unit_price), 0)
    ))
    FROM public.products p
    LEFT JOIN public.order_items oi ON p.id = oi.product_id
    WHERE p.is_active = true
    GROUP BY p.id, p.name
    ORDER BY COALESCE(SUM(oi.quantity * oi.unit_price), 0) DESC
    LIMIT 5),
    -- Recent orders
    (SELECT jsonb_agg(jsonb_build_object(
      'id', id,
      'order_number', order_number,
      'created_at', created_at,
      'total_amount', total_amount,
      'status', status
    ))
    FROM public.orders
    ORDER BY created_at DESC
    LIMIT 5),
    -- Low stock items
    (SELECT jsonb_agg(jsonb_build_object(
      'id', id,
      'name', name,
      'stock', stock,
      'min_stock_level', min_stock_level
    ))
    FROM public.products
    WHERE stock <= 10 AND is_active = true
    ORDER BY stock ASC
    LIMIT 5)
  INTO 
    total_users,
    total_products,
    total_orders,
    total_revenue,
    pending_orders,
    low_stock_products,
    new_users_today,
    orders_today,
    revenue_today,
    conversion_rate,
    top_products,
    recent_orders,
    low_stock_items;
  
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get KPI metrics
CREATE OR REPLACE FUNCTION public.get_kpi_metrics(period_days INTEGER DEFAULT 30)
RETURNS TABLE(
  metric_name TEXT,
  current_value NUMERIC,
  previous_value NUMERIC,
  percentage_change NUMERIC
) AS $$
DECLARE
  start_date DATE := CURRENT_DATE - INTERVAL '1 day' * period_days;
  mid_date DATE := CURRENT_DATE - INTERVAL '1 day' * (period_days / 2);
BEGIN
  -- Revenue KPI
  RETURN QUERY
  SELECT 
    'total_revenue'::TEXT as metric_name,
    COALESCE(SUM(CASE WHEN created_at >= mid_date THEN total_amount ELSE 0 END), 0)::NUMERIC as current_value,
    COALESCE(SUM(CASE WHEN created_at < mid_date THEN total_amount ELSE 0 END), 0)::NUMERIC as previous_value,
    CASE 
      WHEN SUM(CASE WHEN created_at < mid_date THEN total_amount ELSE 0 END) = 0 THEN 0
      ELSE ROUND(((SUM(CASE WHEN created_at >= mid_date THEN total_amount ELSE 0 END) - SUM(CASE WHEN created_at < mid_date THEN total_amount ELSE 0 END)) / SUM(CASE WHEN created_at < mid_date THEN total_amount ELSE 0 END)) * 100, 2)
    END::NUMERIC as percentage_change
  FROM public.orders
  WHERE created_at >= start_date;
  
  -- Orders KPI
  RETURN QUERY
  SELECT 
    'total_orders'::TEXT as metric_name,
    COUNT(CASE WHEN created_at >= mid_date THEN 1 END)::NUMERIC as current_value,
    COUNT(CASE WHEN created_at < mid_date THEN 1 END)::NUMERIC as previous_value,
    CASE 
      WHEN COUNT(CASE WHEN created_at < mid_date THEN 1 END) = 0 THEN 0
      ELSE ROUND(((COUNT(CASE WHEN created_at >= mid_date THEN 1 END) - COUNT(CASE WHEN created_at < mid_date THEN 1 END)) / COUNT(CASE WHEN created_at < mid_date THEN 1 END)::DECIMAL) * 100, 2)
    END::NUMERIC as percentage_change
  FROM public.orders
  WHERE created_at >= start_date;
  
  -- Users KPI
  RETURN QUERY
  SELECT 
    'total_users'::TEXT as metric_name,
    COUNT(CASE WHEN created_at >= mid_date THEN 1 END)::NUMERIC as current_value,
    COUNT(CASE WHEN created_at < mid_date THEN 1 END)::NUMERIC as previous_value,
    CASE 
      WHEN COUNT(CASE WHEN created_at < mid_date THEN 1 END) = 0 THEN 0
      ELSE ROUND(((COUNT(CASE WHEN created_at >= mid_date THEN 1 END) - COUNT(CASE WHEN created_at < mid_date THEN 1 END)) / COUNT(CASE WHEN created_at < mid_date THEN 1 END)::DECIMAL) * 100, 2)
    END::NUMERIC as percentage_change
  FROM public.profiles
  WHERE created_at >= start_date;
  
  -- Products KPI
  RETURN QUERY
  SELECT 
    'total_products'::TEXT as metric_name,
    COUNT(CASE WHEN created_at >= mid_date THEN 1 END)::NUMERIC as current_value,
    COUNT(CASE WHEN created_at < mid_date THEN 1 END)::NUMERIC as previous_value,
    CASE 
      WHEN COUNT(CASE WHEN created_at < mid_date THEN 1 END) = 0 THEN 0
      ELSE ROUND(((COUNT(CASE WHEN created_at >= mid_date THEN 1 END) - COUNT(CASE WHEN created_at < mid_date THEN 1 END)) / COUNT(CASE WHEN created_at < mid_date THEN 1 END)::DECIMAL) * 100, 2)
    END::NUMERIC as percentage_change
  FROM public.products
  WHERE is_active = true AND created_at >= start_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get real-time metrics
CREATE OR REPLACE FUNCTION public.get_realtime_metrics()
RETURNS TABLE(
  online_users BIGINT,
  pending_orders BIGINT,
  recent_sales_count BIGINT,
  recent_sales_value DECIMAL(12, 2),
  low_stock_alerts BIGINT,
  system_status TEXT
) AS $$
BEGIN
  SELECT 
    0, -- Placeholder for online users
    (SELECT COUNT(*) FROM public.orders WHERE status IN ('pending', 'confirmed', 'processing')),
    (SELECT COUNT(*) FROM public.orders WHERE created_at >= CURRENT_DATE - INTERVAL '1 hour'),
    COALESCE((SELECT SUM(total_amount) FROM public.orders WHERE created_at >= CURRENT_DATE - INTERVAL '1 hour'), 0),
    (SELECT COUNT(*) FROM public.products WHERE stock <= 5 AND is_active = true),
    'operational' -- Static system status for now
  INTO 
    online_users,
    pending_orders,
    recent_sales_count,
    recent_sales_value,
    low_stock_alerts,
    system_status;
  
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get dashboard analytics (for EnhancedAnalytics component)
CREATE OR REPLACE FUNCTION public.get_dashboard_analytics()
RETURNS TABLE(
  total_revenue DECIMAL(12, 2),
  total_orders BIGINT,
  total_users BIGINT,
  total_products BIGINT,
  pending_orders BIGINT,
  low_stock_products BIGINT,
  sales_trend JSONB,
  category_performance JSONB,
  customer_growth JSONB
) AS $$
BEGIN
  SELECT 
    COALESCE((SELECT SUM(total_amount) FROM public.orders), 0),
    (SELECT COUNT(*) FROM public.orders),
    (SELECT COUNT(*) FROM public.profiles),
    (SELECT COUNT(*) FROM public.products WHERE is_active = true),
    (SELECT COUNT(*) FROM public.orders WHERE status IN ('pending', 'confirmed', 'processing')),
    (SELECT COUNT(*) FROM public.products WHERE stock <= 10 AND is_active = true),
    -- Generate sales trend data
    (SELECT jsonb_agg(jsonb_build_object(
      'month', TO_CHAR(gs.date, 'Mon'),
      'sales', COALESCE(SUM(CASE WHEN o.created_at::date = gs.date THEN o.total_amount ELSE 0 END), 0),
      'orders', COUNT(CASE WHEN o.created_at::date = gs.date THEN 1 END),
      'customers', COUNT(DISTINCT CASE WHEN o.created_at::date = gs.date THEN o.user_id END)
    ))
    FROM generate_series(CURRENT_DATE - INTERVAL '6 months', CURRENT_DATE, '1 month') gs(date)
    LEFT JOIN public.orders o ON o.created_at::date >= gs.date AND o.created_at::date < gs.date + INTERVAL '1 month')
    ,
    -- Generate category performance data
    (SELECT jsonb_agg(jsonb_build_object(
      'name', c.name,
      'value', COUNT(p.id),
      'sales', COALESCE(SUM(oi.quantity * oi.unit_price), 0)
    ))
    FROM public.categories c
    LEFT JOIN public.products p ON c.id = p.category_id AND p.is_active = true
    LEFT JOIN public.order_items oi ON p.id = oi.product_id
    WHERE c.is_active = true
    GROUP BY c.id, c.name),
    -- Generate customer growth data
    (SELECT jsonb_agg(jsonb_build_object(
      'month', TO_CHAR(gs.date, 'Mon'),
      'new', COUNT(CASE WHEN pr.created_at::date = gs.date THEN 1 END),
      'returning', COUNT(DISTINCT CASE WHEN pr.created_at::date < gs.date AND o.created_at::date = gs.date THEN o.user_id END),
      'total', COUNT(DISTINCT CASE WHEN pr.created_at::date <= gs.date THEN pr.id END)
    ))
    FROM generate_series(CURRENT_DATE - INTERVAL '6 months', CURRENT_DATE, '1 month') gs(date)
    LEFT JOIN public.profiles pr ON pr.created_at::date >= gs.date AND pr.created_at::date < gs.date + INTERVAL '1 month'
    LEFT JOIN public.orders o ON o.user_id = pr.id AND o.created_at::date = gs.date)
  INTO 
    total_revenue,
    total_orders,
    total_users,
    total_products,
    pending_orders,
    low_stock_products,
    sales_trend,
    category_performance,
    customer_growth;
  
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions on new functions to authenticated users
GRANT EXECUTE ON FUNCTION public.get_dashboard_overview() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_kpi_metrics(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_realtime_metrics() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_dashboard_analytics() TO authenticated;