-- =====================================================
-- MISSING TABLES SCHEMA FOR E-COMMERCE PLATFORM
-- =====================================================
-- This script adds all missing tables identified in the database audit
-- Run this AFTER the main schema script has been executed
-- =====================================================

-- =====================================================
-- USER SECURITY SETTINGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS user_security_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_method TEXT DEFAULT 'email' CHECK (two_factor_method IN ('email', 'sms', 'authenticator')),
    two_factor_phone TEXT,
    two_factor_backup_codes TEXT[] DEFAULT '{}',
    login_alerts BOOLEAN DEFAULT TRUE,
    suspicious_activity_alerts BOOLEAN DEFAULT TRUE,
    session_timeout INTEGER DEFAULT 30, -- minutes
    require_password_for_sensitive_actions BOOLEAN DEFAULT TRUE,
    password_changed_at TIMESTAMPTZ,
    failed_login_attempts INTEGER DEFAULT 0,
    account_locked_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- USER ACTIVITY LOGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS user_activity_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    session_id TEXT,
    action_type TEXT NOT NULL, -- 'login', 'logout', 'purchase', 'view_product', etc.
    action_details TEXT,
    ip_address INET,
    user_agent TEXT,
    device_info JSONB DEFAULT '{}',
    location TEXT,
    success BOOLEAN DEFAULT TRUE,
    suspicious BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- LOGIN ATTEMPTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS login_attempts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    ip_address INET NOT NULL,
    user_agent TEXT,
    success BOOLEAN NOT NULL,
    failure_reason TEXT,
    device_info JSONB DEFAULT '{}',
    location TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- SYSTEM SETTINGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    setting_key TEXT UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    setting_type TEXT DEFAULT 'string' CHECK (setting_type IN ('string', 'number', 'boolean', 'json')),
    category TEXT DEFAULT 'general',
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    is_encrypted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- NOTIFICATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error', 'order', 'promotion', 'system')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    action_url TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    expires_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- AUDIT TRAILS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS audit_trails (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id TEXT NOT NULL,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    session_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- SALES ANALYTICS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS sales_analytics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    date DATE NOT NULL,
    total_sales DECIMAL(12,2) DEFAULT 0,
    total_orders INTEGER DEFAULT 0,
    total_customers INTEGER DEFAULT 0,
    new_customers INTEGER DEFAULT 0,
    returning_customers INTEGER DEFAULT 0,
    average_order_value DECIMAL(10,2) DEFAULT 0,
    conversion_rate DECIMAL(5,4) DEFAULT 0,
    category_breakdown JSONB DEFAULT '{}',
    payment_method_breakdown JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(date)
);

-- =====================================================
-- INVENTORY MOVEMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS inventory_movements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
    variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
    movement_type TEXT NOT NULL CHECK (movement_type IN ('in', 'out', 'adjustment', 'transfer', 'return')),
    quantity INTEGER NOT NULL,
    previous_stock INTEGER NOT NULL,
    new_stock INTEGER NOT NULL,
    reason TEXT,
    reference_type TEXT, -- 'order', 'purchase', 'adjustment', 'return'
    reference_id UUID,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- PRODUCT ANALYTICS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS product_analytics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    views INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    add_to_cart INTEGER DEFAULT 0,
    purchases INTEGER DEFAULT 0,
    revenue DECIMAL(10,2) DEFAULT 0,
    units_sold INTEGER DEFAULT 0,
    bounce_rate DECIMAL(5,4) DEFAULT 0,
    conversion_rate DECIMAL(5,4) DEFAULT 0,
    average_time_on_page INTEGER DEFAULT 0, -- seconds
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(product_id, date)
);

-- =====================================================
-- USER SESSIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    session_token TEXT UNIQUE NOT NULL,
    ip_address INET NOT NULL,
    user_agent TEXT,
    device_info JSONB DEFAULT '{}',
    location TEXT,
    last_activity TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- EMAIL TEMPLATES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS email_templates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    template_key TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    subject TEXT NOT NULL,
    body_html TEXT NOT NULL,
    body_text TEXT,
    variables TEXT[] DEFAULT '{}', -- Available template variables
    category TEXT DEFAULT 'general',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- BACKUP LOGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS backup_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    backup_type TEXT NOT NULL CHECK (backup_type IN ('full', 'incremental', 'differential')),
    status TEXT NOT NULL CHECK (status IN ('started', 'completed', 'failed', 'cancelled')),
    file_path TEXT,
    file_size BIGINT,
    compression_type TEXT,
    started_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ,
    error_message TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- API KEYS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    key_name TEXT NOT NULL,
    key_hash TEXT UNIQUE NOT NULL, -- Hashed version of the actual key
    permissions TEXT[] DEFAULT '{}',
    rate_limit INTEGER DEFAULT 1000, -- requests per hour
    last_used TIMESTAMPTZ,
    usage_count INTEGER DEFAULT 0,
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- FEATURE FLAGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS feature_flags (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    flag_key TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    is_enabled BOOLEAN DEFAULT FALSE,
    rollout_percentage INTEGER DEFAULT 0 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
    target_users TEXT[] DEFAULT '{}',
    target_roles TEXT[] DEFAULT '{}',
    environment TEXT DEFAULT 'production' CHECK (environment IN ('development', 'staging', 'production')),
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- PAYMENT METHODS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS payment_methods (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('credit', 'debit', 'paypal', 'bank_account', 'digital_wallet')),
    provider TEXT NOT NULL,
    last_four TEXT NOT NULL,
    expiry_month INTEGER CHECK (expiry_month >= 1 AND expiry_month <= 12),
    expiry_year INTEGER,
    holder_name TEXT NOT NULL,
    billing_address_id UUID REFERENCES addresses(id) ON DELETE SET NULL,
    is_default BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    encrypted_data TEXT, -- Encrypted payment details
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- User Security Settings indexes
CREATE INDEX IF NOT EXISTS idx_user_security_settings_user_id ON user_security_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_security_settings_two_factor ON user_security_settings(two_factor_enabled) WHERE two_factor_enabled = true;

-- User Activity Logs indexes
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_user_id ON user_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_created_at ON user_activity_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_action_type ON user_activity_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_suspicious ON user_activity_logs(suspicious) WHERE suspicious = true;
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_ip_address ON user_activity_logs(ip_address);

-- Login Attempts indexes
CREATE INDEX IF NOT EXISTS idx_login_attempts_email ON login_attempts(email);
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip_address ON login_attempts(ip_address);
CREATE INDEX IF NOT EXISTS idx_login_attempts_created_at ON login_attempts(created_at);
CREATE INDEX IF NOT EXISTS idx_login_attempts_success ON login_attempts(success);

-- System Settings indexes
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_system_settings_category ON system_settings(category);
CREATE INDEX IF NOT EXISTS idx_system_settings_public ON system_settings(is_public) WHERE is_public = true;

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON notifications(priority);

-- Audit Trails indexes
CREATE INDEX IF NOT EXISTS idx_audit_trails_user_id ON audit_trails(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_trails_table_name ON audit_trails(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_trails_record_id ON audit_trails(record_id);
CREATE INDEX IF NOT EXISTS idx_audit_trails_created_at ON audit_trails(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_trails_action ON audit_trails(action);

-- Sales Analytics indexes
CREATE INDEX IF NOT EXISTS idx_sales_analytics_date ON sales_analytics(date);
CREATE INDEX IF NOT EXISTS idx_sales_analytics_total_sales ON sales_analytics(total_sales);

-- Inventory Movements indexes
CREATE INDEX IF NOT EXISTS idx_inventory_movements_product_id ON inventory_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_variant_id ON inventory_movements(variant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_created_at ON inventory_movements(created_at);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_type ON inventory_movements(movement_type);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_reference ON inventory_movements(reference_type, reference_id);

-- Product Analytics indexes
CREATE INDEX IF NOT EXISTS idx_product_analytics_product_id ON product_analytics(product_id);
CREATE INDEX IF NOT EXISTS idx_product_analytics_date ON product_analytics(date);
CREATE INDEX IF NOT EXISTS idx_product_analytics_views ON product_analytics(views);
CREATE INDEX IF NOT EXISTS idx_product_analytics_revenue ON product_analytics(revenue);

-- User Sessions indexes
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_last_activity ON user_sessions(last_activity);

-- Email Templates indexes
CREATE INDEX IF NOT EXISTS idx_email_templates_key ON email_templates(template_key);
CREATE INDEX IF NOT EXISTS idx_email_templates_category ON email_templates(category);
CREATE INDEX IF NOT EXISTS idx_email_templates_active ON email_templates(is_active) WHERE is_active = true;

-- Backup Logs indexes
CREATE INDEX IF NOT EXISTS idx_backup_logs_status ON backup_logs(status);
CREATE INDEX IF NOT EXISTS idx_backup_logs_started_at ON backup_logs(started_at);
CREATE INDEX IF NOT EXISTS idx_backup_logs_type ON backup_logs(backup_type);

-- API Keys indexes
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_keys(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_api_keys_expires_at ON api_keys(expires_at);

-- Feature Flags indexes
CREATE INDEX IF NOT EXISTS idx_feature_flags_key ON feature_flags(flag_key);
CREATE INDEX IF NOT EXISTS idx_feature_flags_enabled ON feature_flags(is_enabled) WHERE is_enabled = true;
CREATE INDEX IF NOT EXISTS idx_feature_flags_environment ON feature_flags(environment);

-- Payment Methods indexes
CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_default ON payment_methods(user_id, is_default) WHERE is_default = true;
CREATE INDEX IF NOT EXISTS idx_payment_methods_verified ON payment_methods(is_verified) WHERE is_verified = true;

-- =====================================================
-- TRIGGERS FOR UPDATED_AT TIMESTAMPS
-- =====================================================

-- Apply updated_at triggers to new tables
CREATE TRIGGER update_user_security_settings_updated_at BEFORE UPDATE ON user_security_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sales_analytics_updated_at BEFORE UPDATE ON sales_analytics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_product_analytics_updated_at BEFORE UPDATE ON product_analytics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON email_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_api_keys_updated_at BEFORE UPDATE ON api_keys FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_feature_flags_updated_at BEFORE UPDATE ON feature_flags FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payment_methods_updated_at BEFORE UPDATE ON payment_methods FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on all new tables
ALTER TABLE user_security_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_trails ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- USER SECURITY SETTINGS POLICIES
-- =====================================================

-- Users can view and update their own security settings
CREATE POLICY user_security_settings_own ON user_security_settings
    FOR ALL USING (auth.uid() = user_id);

-- Admins can view all security settings
CREATE POLICY user_security_settings_admin ON user_security_settings
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
    );

-- =====================================================
-- USER ACTIVITY LOGS POLICIES
-- =====================================================

-- Users can view their own activity logs
CREATE POLICY user_activity_logs_own ON user_activity_logs
    FOR SELECT USING (auth.uid() = user_id);

-- Admins can view all activity logs
CREATE POLICY user_activity_logs_admin ON user_activity_logs
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
    );

-- System can insert activity logs
CREATE POLICY user_activity_logs_insert ON user_activity_logs
    FOR INSERT WITH CHECK (true);

-- =====================================================
-- LOGIN ATTEMPTS POLICIES
-- =====================================================

-- Users can view their own login attempts
CREATE POLICY login_attempts_own ON login_attempts
    FOR SELECT USING (auth.uid() = user_id);

-- Admins can view all login attempts
CREATE POLICY login_attempts_admin ON login_attempts
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
    );

-- System can insert login attempts
CREATE POLICY login_attempts_insert ON login_attempts
    FOR INSERT WITH CHECK (true);

-- =====================================================
-- SYSTEM SETTINGS POLICIES
-- =====================================================

-- Everyone can view public settings
CREATE POLICY system_settings_public ON system_settings
    FOR SELECT USING (is_public = TRUE);

-- Admins can manage all settings
CREATE POLICY system_settings_admin ON system_settings
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
    );

-- =====================================================
-- NOTIFICATIONS POLICIES
-- =====================================================

-- Users can manage their own notifications
CREATE POLICY notifications_own ON notifications
    FOR ALL USING (auth.uid() = user_id);

-- Admins can view all notifications
CREATE POLICY notifications_admin ON notifications
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
    );

-- =====================================================
-- AUDIT TRAILS POLICIES
-- =====================================================

-- Only admins can view audit trails
CREATE POLICY audit_trails_admin ON audit_trails
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
    );

-- System can insert audit trails
CREATE POLICY audit_trails_insert ON audit_trails
    FOR INSERT WITH CHECK (true);

-- =====================================================
-- SALES ANALYTICS POLICIES
-- =====================================================

-- Only admins and vendors can view sales analytics
CREATE POLICY sales_analytics_admin_vendor ON sales_analytics
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_admin = TRUE OR is_vendor = TRUE))
    );

-- Only admins can manage sales analytics
CREATE POLICY sales_analytics_admin ON sales_analytics
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
    );

-- =====================================================
-- INVENTORY MOVEMENTS POLICIES
-- =====================================================

-- Only admins and vendors can view inventory movements
CREATE POLICY inventory_movements_admin_vendor ON inventory_movements
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_admin = TRUE OR is_vendor = TRUE))
    );

-- Only admins and vendors can manage inventory movements
CREATE POLICY inventory_movements_manage ON inventory_movements
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_admin = TRUE OR is_vendor = TRUE))
    );

-- =====================================================
-- PRODUCT ANALYTICS POLICIES
-- =====================================================

-- Only admins and vendors can view product analytics
CREATE POLICY product_analytics_admin_vendor ON product_analytics
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_admin = TRUE OR is_vendor = TRUE))
    );

-- Only admins can manage product analytics
CREATE POLICY product_analytics_admin ON product_analytics
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
    );

-- =====================================================
-- USER SESSIONS POLICIES
-- =====================================================

-- Users can view their own sessions
CREATE POLICY user_sessions_own ON user_sessions
    FOR SELECT USING (auth.uid() = user_id);

-- Users can delete their own sessions
CREATE POLICY user_sessions_delete_own ON user_sessions
    FOR DELETE USING (auth.uid() = user_id);

-- Admins can view all sessions
CREATE POLICY user_sessions_admin ON user_sessions
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
    );

-- System can manage sessions
CREATE POLICY user_sessions_system ON user_sessions
    FOR ALL WITH CHECK (true);

-- =====================================================
-- EMAIL TEMPLATES POLICIES
-- =====================================================

-- Everyone can view active email templates
CREATE POLICY email_templates_public ON email_templates
    FOR SELECT USING (is_active = TRUE);

-- Only admins can manage email templates
CREATE POLICY email_templates_admin ON email_templates
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
    );

-- =====================================================
-- BACKUP LOGS POLICIES
-- =====================================================

-- Only admins can view backup logs
CREATE POLICY backup_logs_admin ON backup_logs
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
    );

-- System can insert backup logs
CREATE POLICY backup_logs_insert ON backup_logs
    FOR INSERT WITH CHECK (true);

-- =====================================================
-- API KEYS POLICIES
-- =====================================================

-- Users can manage their own API keys
CREATE POLICY api_keys_own ON api_keys
    FOR ALL USING (auth.uid() = user_id);

-- Admins can view all API keys
CREATE POLICY api_keys_admin ON api_keys
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
    );

-- =====================================================
-- FEATURE FLAGS POLICIES
-- =====================================================

-- Everyone can view enabled feature flags
CREATE POLICY feature_flags_public ON feature_flags
    FOR SELECT USING (is_enabled = TRUE);

-- Only admins can manage feature flags
CREATE POLICY feature_flags_admin ON feature_flags
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
    );

-- =====================================================
-- PAYMENT METHODS POLICIES
-- =====================================================

-- Users can manage their own payment methods
CREATE POLICY payment_methods_own ON payment_methods
    FOR ALL USING (auth.uid() = user_id);

-- Admins can view all payment methods
CREATE POLICY payment_methods_admin ON payment_methods
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
    );

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

-- Display success message
SELECT 'Missing tables schema applied successfully!' as message,
       'All missing tables, indexes, triggers, and RLS policies have been created.' as details,
       'Dashboard components should now have full database support.' as next_step;
