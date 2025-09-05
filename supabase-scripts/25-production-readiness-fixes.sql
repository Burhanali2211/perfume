-- ==========================================
-- 25-production-readiness-fixes.sql
-- Critical fixes for production deployment
-- ==========================================

-- ==========================================
-- 1. CREATE MISSING SYSTEM_SETTINGS TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS public.system_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_name TEXT DEFAULT 'Attars E-commerce',
  site_description TEXT DEFAULT 'Your one-stop shop for everything',
  site_url TEXT,
  contact_email TEXT,
  support_email TEXT,
  currency TEXT DEFAULT 'USD',
  tax_rate DECIMAL(5,4) DEFAULT 0,
  shipping_fee DECIMAL(10,2) DEFAULT 0,
  free_shipping_threshold DECIMAL(10,2) DEFAULT 0,
  allow_guest_checkout BOOLEAN DEFAULT true,
  require_email_verification BOOLEAN DEFAULT false,
  enable_reviews BOOLEAN DEFAULT true,
  enable_wishlist BOOLEAN DEFAULT true,
  enable_coupons BOOLEAN DEFAULT true,
  maintenance_mode BOOLEAN DEFAULT false,
  smtp_host TEXT,
  smtp_port INTEGER DEFAULT 587,
  smtp_username TEXT,
  smtp_password TEXT,
  smtp_secure BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS and create policies for system_settings
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view system settings" ON public.system_settings
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage system settings" ON public.system_settings
  FOR ALL USING (public.is_admin(auth.uid()));

-- Insert default settings
INSERT INTO public.system_settings (site_name, currency, site_description) 
VALUES ('Attars E-commerce', 'USD', 'Your one-stop shop for everything')
ON CONFLICT (id) DO NOTHING;

-- ==========================================
-- 2. CREATE MARKETING CAMPAIGN TABLES
-- ==========================================

CREATE TABLE IF NOT EXISTS public.marketing_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('email', 'sms', 'social', 'banner', 'popup')) DEFAULT 'email',
  status TEXT CHECK (status IN ('draft', 'active', 'paused', 'completed', 'scheduled')) DEFAULT 'draft',
  target_audience JSONB DEFAULT '{}',
  content JSONB DEFAULT '{}',
  schedule_start TIMESTAMP WITH TIME ZONE,
  schedule_end TIMESTAMP WITH TIME ZONE,
  budget DECIMAL(10,2) DEFAULT 0,
  spent DECIMAL(10,2) DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  revenue DECIMAL(10,2) DEFAULT 0,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for marketing campaigns
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_status ON public.marketing_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_type ON public.marketing_campaigns(type);
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_created_by ON public.marketing_campaigns(created_by);
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_dates ON public.marketing_campaigns(schedule_start, schedule_end);

-- Enable RLS and create policies
ALTER TABLE public.marketing_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage campaigns" ON public.marketing_campaigns
  FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Everyone can view active campaigns" ON public.marketing_campaigns
  FOR SELECT USING (status = 'active');

-- ==========================================
-- 3. CREATE CAMPAIGN METRICS TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS public.campaign_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES public.marketing_campaigns(id) ON DELETE CASCADE,
  metric_date DATE DEFAULT CURRENT_DATE,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  revenue DECIMAL(10,2) DEFAULT 0,
  cost DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for campaign metrics
CREATE INDEX IF NOT EXISTS idx_campaign_metrics_campaign_id ON public.campaign_metrics(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_metrics_date ON public.campaign_metrics(metric_date);

-- Enable RLS
ALTER TABLE public.campaign_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage campaign metrics" ON public.campaign_metrics
  FOR ALL USING (public.is_admin(auth.uid()));

-- ==========================================
-- 4. CREATE SYSTEM HEALTH METRICS TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS public.system_health_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  metric_name TEXT NOT NULL,
  metric_value DECIMAL(10,4) NOT NULL,
  metric_unit TEXT DEFAULT '',
  status TEXT CHECK (status IN ('healthy', 'warning', 'critical')) DEFAULT 'healthy',
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

-- Create indexes for system health metrics
CREATE INDEX IF NOT EXISTS idx_system_health_metrics_name ON public.system_health_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_system_health_metrics_recorded_at ON public.system_health_metrics(recorded_at);
CREATE INDEX IF NOT EXISTS idx_system_health_metrics_status ON public.system_health_metrics(status);

-- Enable RLS
ALTER TABLE public.system_health_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage system health metrics" ON public.system_health_metrics
  FOR ALL USING (public.is_admin(auth.uid()));

-- ==========================================
-- 5. FIX MISSING DASHBOARD FUNCTIONS
-- ==========================================

-- Dashboard Overview Function (Enhanced)
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
            ), '[]'::json)
            FROM public.orders o
            LEFT JOIN public.profiles p ON o.user_id = p.id
            ORDER BY o.created_at DESC
            LIMIT 5
        ),
        'top_products', (
            SELECT COALESCE(json_agg(
                json_build_object(
                    'id', pr.id,
                    'name', pr.name,
                    'sales_count', COALESCE(sales.count, 0),
                    'revenue', COALESCE(sales.revenue, 0)
                )
            ), '[]'::json)
            FROM public.products pr
            LEFT JOIN (
                SELECT 
                    oi.product_id,
                    COUNT(*) as count,
                    SUM(oi.price * oi.quantity) as revenue
                FROM public.order_items oi
                JOIN public.orders o ON oi.order_id = o.id
                WHERE o.status IN ('completed', 'delivered')
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

-- Grant permissions
GRANT SELECT ON public.system_settings TO anon, authenticated;
GRANT ALL ON public.system_settings TO service_role;
GRANT SELECT ON public.marketing_campaigns TO anon, authenticated;
GRANT ALL ON public.marketing_campaigns TO authenticated;
GRANT ALL ON public.marketing_campaigns TO service_role;
GRANT SELECT ON public.campaign_metrics TO authenticated;
GRANT ALL ON public.campaign_metrics TO service_role;
GRANT SELECT ON public.system_health_metrics TO authenticated;
GRANT ALL ON public.system_health_metrics TO service_role;

-- Create triggers for updated_at columns
CREATE TRIGGER update_system_settings_updated_at
  BEFORE UPDATE ON public.system_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_marketing_campaigns_updated_at
  BEFORE UPDATE ON public.marketing_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ==========================================
-- 6. VERIFICATION QUERIES
-- ==========================================

-- Verify all tables exist
SELECT 'Tables created successfully' as status;

SELECT table_name, 
       CASE WHEN table_name IN ('system_settings', 'marketing_campaigns', 'campaign_metrics', 'system_health_metrics') 
            THEN 'NEWLY CREATED' 
            ELSE 'EXISTING' 
       END as table_status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
  AND table_name IN ('system_settings', 'marketing_campaigns', 'campaign_metrics', 'system_health_metrics')
ORDER BY table_name;
