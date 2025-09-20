-- ==========================================
-- 11-analytics.sql
-- Analytics and reporting functionality
-- ==========================================

-- Create analytics events table
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type TEXT NOT NULL,
  user_id UUID REFERENCES public.profiles(id),
  product_id UUID REFERENCES public.products(id),
  category_id UUID REFERENCES public.categories(id),
  session_id TEXT,
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,
  url TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for analytics events
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON public.analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON public.analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_product_id ON public.analytics_events(product_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_category_id ON public.analytics_events(category_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id ON public.analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON public.analytics_events(created_at);

-- Enable RLS on analytics events
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Create policies for analytics events
CREATE POLICY "Service role can insert analytics events" ON public.analytics_events
  FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Admins can view analytics events" ON public.analytics_events
  FOR SELECT USING (public.is_admin(auth.uid()));

-- Grant permissions
GRANT INSERT ON public.analytics_events TO anon, authenticated;
GRANT ALL ON public.analytics_events TO service_role;

-- ==========================================
-- Analytics Views
-- ==========================================

-- Create a view for product view counts
CREATE OR REPLACE VIEW public.product_view_counts AS
SELECT 
  product_id,
  COUNT(*) as view_count,
  COUNT(DISTINCT session_id) as unique_viewers,
  MIN(created_at) as first_viewed,
  MAX(created_at) as last_viewed
FROM public.analytics_events
WHERE event_type = 'product_view'
GROUP BY product_id;

-- Grant permissions on the view
GRANT SELECT ON public.product_view_counts TO service_role;

-- Create a view for category view counts
CREATE OR REPLACE VIEW public.category_view_counts AS
SELECT 
  category_id,
  COUNT(*) as view_count,
  COUNT(DISTINCT session_id) as unique_viewers,
  MIN(created_at) as first_viewed,
  MAX(created_at) as last_viewed
FROM public.analytics_events
WHERE event_type = 'category_view'
GROUP BY category_id;

-- Grant permissions on the view
GRANT SELECT ON public.category_view_counts TO service_role;

-- Create a view for user activity
CREATE OR REPLACE VIEW public.user_activity AS
SELECT 
  user_id,
  COUNT(*) as total_events,
  COUNT(DISTINCT session_id) as sessions,
  MIN(created_at) as first_activity,
  MAX(created_at) as last_activity,
  ARRAY_AGG(DISTINCT event_type) as event_types
FROM public.analytics_events
WHERE user_id IS NOT NULL
GROUP BY user_id;

-- Grant permissions on the view
GRANT SELECT ON public.user_activity TO service_role;

-- ==========================================
-- Analytics Functions
-- ==========================================

-- Function to record analytics event
CREATE OR REPLACE FUNCTION public.record_analytics_event(
  p_event_type TEXT,
  p_product_id UUID DEFAULT NULL,
  p_category_id UUID DEFAULT NULL,
  p_session_id TEXT DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_referrer TEXT DEFAULT NULL,
  p_url TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.analytics_events (
    event_type,
    user_id,
    product_id,
    category_id,
    session_id,
    ip_address,
    user_agent,
    referrer,
    url,
    metadata
  )
  VALUES (
    p_event_type,
    auth.uid(),
    p_product_id,
    p_category_id,
    p_session_id,
    p_ip_address,
    p_user_agent,
    p_referrer,
    p_url,
    p_metadata
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get dashboard analytics
CREATE OR REPLACE FUNCTION public.get_dashboard_analytics()
RETURNS TABLE(
  total_users BIGINT,
  total_products BIGINT,
  total_orders BIGINT,
  total_revenue DECIMAL(12, 2),
  pending_orders BIGINT,
  low_stock_products BIGINT
) AS $$
BEGIN
  SELECT 
    (SELECT COUNT(*) FROM public.profiles),
    (SELECT COUNT(*) FROM public.products WHERE is_active = true),
    (SELECT COUNT(*) FROM public.orders),
    (SELECT COALESCE(SUM(total_amount), 0) FROM public.orders WHERE status = 'delivered'),
    (SELECT COUNT(*) FROM public.orders WHERE status IN ('pending', 'confirmed', 'processing')),
    (SELECT COUNT(*) FROM public.products WHERE stock <= min_stock_level AND is_active = true)
  INTO 
    total_users,
    total_products,
    total_orders,
    total_revenue,
    pending_orders,
    low_stock_products;
  
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get sales trends
CREATE OR REPLACE FUNCTION public.get_sales_trends(period TEXT DEFAULT 'week')
RETURNS TABLE(
  date_bucket DATE,
  sales_count BIGINT,
  sales_amount DECIMAL(12, 2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    DATE_TRUNC(period, created_at)::DATE as date_bucket,
    COUNT(*) as sales_count,
    SUM(total_amount) as sales_amount
  FROM public.orders
  WHERE status = 'delivered'
    AND created_at >= CASE 
      WHEN period = 'week' THEN NOW() - INTERVAL '7 days'
      WHEN period = 'month' THEN NOW() - INTERVAL '30 days'
      WHEN period = 'year' THEN NOW() - INTERVAL '365 days'
      ELSE NOW() - INTERVAL '7 days'
    END
  GROUP BY DATE_TRUNC(period, created_at)
  ORDER BY date_bucket;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get top selling products
CREATE OR REPLACE FUNCTION public.get_top_selling_products(limit_count INTEGER DEFAULT 10)
RETURNS TABLE(
  product_id UUID,
  product_name TEXT,
  sold_quantity BIGINT,
  revenue DECIMAL(12, 2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as product_id,
    p.name as product_name,
    SUM(oi.quantity) as sold_quantity,
    SUM(oi.total_price) as revenue
  FROM public.products p
  JOIN public.order_items oi ON p.id = oi.product_id
  JOIN public.orders o ON oi.order_id = o.id
  WHERE o.status = 'delivered'
  GROUP BY p.id, p.name
  ORDER BY revenue DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;