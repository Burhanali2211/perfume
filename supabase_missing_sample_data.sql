-- =====================================================
-- SAMPLE DATA FOR MISSING TABLES
-- =====================================================
-- This script populates the missing tables with realistic sample data
-- Run this AFTER the missing tables and functions scripts
-- =====================================================

-- Insert default system settings
INSERT INTO system_settings (setting_key, setting_value, setting_type, category, description, is_public) VALUES
('site_name', 'E-Commerce Platform', 'string', 'general', 'Name of the e-commerce site', true),
('site_description', 'Your one-stop shop for everything', 'string', 'general', 'Site description for SEO', true),
('maintenance_mode', 'false', 'boolean', 'general', 'Enable maintenance mode', false),
('allow_registration', 'true', 'boolean', 'auth', 'Allow new user registration', false),
('require_email_verification', 'true', 'boolean', 'auth', 'Require email verification for new users', false),
('session_timeout', '30', 'number', 'security', 'Session timeout in minutes', false),
('max_login_attempts', '5', 'number', 'security', 'Maximum failed login attempts before lockout', false),
('password_min_length', '8', 'number', 'security', 'Minimum password length', false),
('enable_two_factor', 'false', 'boolean', 'security', 'Enable two-factor authentication', false),
('smtp_host', 'smtp.gmail.com', 'string', 'email', 'SMTP server host', false),
('smtp_port', '587', 'number', 'email', 'SMTP server port', false),
('from_email', 'noreply@ecommerce.com', 'string', 'email', 'Default from email address', false),
('currency', 'USD', 'string', 'commerce', 'Default currency', true),
('tax_rate', '0.18', 'number', 'commerce', 'Default tax rate (18% GST)', true),
('free_shipping_threshold', '500', 'number', 'commerce', 'Minimum order for free shipping', true);

-- Insert default email templates
INSERT INTO email_templates (template_key, name, subject, body_html, body_text, variables, category) VALUES
('welcome', 'Welcome Email', 'Welcome to {{site_name}}!', 
 '<h1>Welcome {{user_name}}!</h1><p>Thank you for joining {{site_name}}. We''re excited to have you on board!</p>', 
 'Welcome {{user_name}}! Thank you for joining {{site_name}}. We''re excited to have you on board!',
 ARRAY['user_name', 'site_name'], 'auth'),

('order_confirmation', 'Order Confirmation', 'Order Confirmation - {{order_number}}',
 '<h1>Order Confirmed!</h1><p>Your order {{order_number}} has been confirmed. Total: {{total_amount}}</p>',
 'Order Confirmed! Your order {{order_number}} has been confirmed. Total: {{total_amount}}',
 ARRAY['order_number', 'total_amount', 'user_name'], 'orders'),

('password_reset', 'Password Reset', 'Reset Your Password',
 '<h1>Password Reset</h1><p>Click the link below to reset your password: {{reset_link}}</p>',
 'Password Reset. Click the link below to reset your password: {{reset_link}}',
 ARRAY['user_name', 'reset_link'], 'auth'),

('low_stock_alert', 'Low Stock Alert', 'Low Stock Alert - {{product_name}}',
 '<h1>Low Stock Alert</h1><p>Product {{product_name}} is running low. Current stock: {{current_stock}}</p>',
 'Low Stock Alert. Product {{product_name}} is running low. Current stock: {{current_stock}}',
 ARRAY['product_name', 'current_stock', 'sku'], 'inventory'),

('order_shipped', 'Order Shipped', 'Your Order Has Shipped - {{order_number}}',
 '<h1>Order Shipped!</h1><p>Your order {{order_number}} has been shipped. Tracking: {{tracking_number}}</p>',
 'Order Shipped! Your order {{order_number}} has been shipped. Tracking: {{tracking_number}}',
 ARRAY['order_number', 'tracking_number', 'user_name'], 'orders');

-- Insert default feature flags
INSERT INTO feature_flags (flag_key, name, description, is_enabled, rollout_percentage, environment) VALUES
('enable_reviews', 'Product Reviews', 'Enable product review system', true, 100, 'production'),
('enable_wishlist', 'Wishlist Feature', 'Enable user wishlist functionality', true, 100, 'production'),
('enable_coupons', 'Coupon System', 'Enable coupon and discount system', true, 100, 'production'),
('enable_analytics', 'Advanced Analytics', 'Enable advanced analytics dashboard', true, 50, 'production'),
('enable_bulk_import', 'Bulk Product Import', 'Enable bulk product import feature', true, 100, 'production'),
('enable_inventory_tracking', 'Inventory Tracking', 'Enable real-time inventory tracking', true, 100, 'production'),
('enable_notifications', 'Push Notifications', 'Enable push notification system', false, 0, 'production'),
('enable_chat_support', 'Live Chat Support', 'Enable live chat support widget', false, 25, 'production'),
('enable_social_login', 'Social Media Login', 'Enable login with social media accounts', true, 75, 'production'),
('enable_guest_checkout', 'Guest Checkout', 'Allow checkout without account creation', true, 100, 'production');

-- Insert sample notifications for existing users (if any)
-- This will only insert if there are existing users in the profiles table
INSERT INTO notifications (user_id, type, title, message, priority)
SELECT 
    id,
    'info',
    'Welcome to the Platform!',
    'Thank you for joining our e-commerce platform. Explore our features and start shopping!',
    'normal'
FROM profiles 
WHERE created_at >= NOW() - INTERVAL '7 days'
LIMIT 10;

-- Insert sample backup logs
INSERT INTO backup_logs (backup_type, status, file_path, file_size, started_at, completed_at) VALUES
('full', 'completed', '/backups/full_backup_2024_01_15.sql.gz', 52428800, NOW() - INTERVAL '1 day', NOW() - INTERVAL '23 hours'),
('incremental', 'completed', '/backups/inc_backup_2024_01_16.sql.gz', 5242880, NOW() - INTERVAL '12 hours', NOW() - INTERVAL '11 hours'),
('full', 'completed', '/backups/full_backup_2024_01_16.sql.gz', 54525952, NOW() - INTERVAL '6 hours', NOW() - INTERVAL '5 hours');

-- Insert sample sales analytics data for the last 30 days
INSERT INTO sales_analytics (date, total_sales, total_orders, total_customers, new_customers, returning_customers, average_order_value)
SELECT 
    date_series.date,
    ROUND((RANDOM() * 5000 + 1000)::NUMERIC, 2) as total_sales,
    FLOOR(RANDOM() * 50 + 10)::INTEGER as total_orders,
    FLOOR(RANDOM() * 30 + 5)::INTEGER as total_customers,
    FLOOR(RANDOM() * 10 + 1)::INTEGER as new_customers,
    FLOOR(RANDOM() * 20 + 4)::INTEGER as returning_customers,
    ROUND((RANDOM() * 200 + 50)::NUMERIC, 2) as average_order_value
FROM (
    SELECT generate_series(
        CURRENT_DATE - INTERVAL '29 days',
        CURRENT_DATE,
        INTERVAL '1 day'
    )::DATE as date
) date_series;

-- Insert sample user activity logs for existing users
INSERT INTO user_activity_logs (user_id, action_type, action_details, ip_address, user_agent, success)
SELECT 
    p.id,
    (ARRAY['login', 'logout', 'view_product', 'add_to_cart', 'purchase', 'profile_update'])[FLOOR(RANDOM() * 6 + 1)],
    'Sample activity log entry',
    ('192.168.1.' || FLOOR(RANDOM() * 255 + 1))::INET,
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    RANDOM() > 0.1 -- 90% success rate
FROM profiles p
CROSS JOIN generate_series(1, 5) -- 5 activities per user
WHERE p.created_at >= NOW() - INTERVAL '30 days'
LIMIT 100;

-- Insert sample login attempts
INSERT INTO login_attempts (user_id, email, ip_address, user_agent, success, failure_reason)
SELECT 
    p.id,
    p.email,
    ('192.168.1.' || FLOOR(RANDOM() * 255 + 1))::INET,
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    RANDOM() > 0.2, -- 80% success rate
    CASE WHEN RANDOM() <= 0.2 THEN 'invalid_password' ELSE NULL END
FROM profiles p
CROSS JOIN generate_series(1, 3) -- 3 login attempts per user
WHERE p.created_at >= NOW() - INTERVAL '7 days'
LIMIT 50;

-- Insert sample product analytics for existing products
INSERT INTO product_analytics (product_id, date, views, clicks, add_to_cart, purchases, revenue, units_sold)
SELECT 
    p.id,
    date_series.date,
    FLOOR(RANDOM() * 100 + 10)::INTEGER as views,
    FLOOR(RANDOM() * 20 + 2)::INTEGER as clicks,
    FLOOR(RANDOM() * 5 + 1)::INTEGER as add_to_cart,
    FLOOR(RANDOM() * 3)::INTEGER as purchases,
    ROUND((RANDOM() * 500 + 50)::NUMERIC, 2) as revenue,
    FLOOR(RANDOM() * 3)::INTEGER as units_sold
FROM products p
CROSS JOIN (
    SELECT generate_series(
        CURRENT_DATE - INTERVAL '7 days',
        CURRENT_DATE,
        INTERVAL '1 day'
    )::DATE as date
) date_series
WHERE p.is_active = true
LIMIT 200;

-- Insert sample inventory movements for existing products
INSERT INTO inventory_movements (product_id, movement_type, quantity, previous_stock, new_stock, reason, reference_type, user_id)
SELECT 
    p.id,
    (ARRAY['in', 'out', 'adjustment'])[FLOOR(RANDOM() * 3 + 1)],
    FLOOR(RANDOM() * 20 + 1)::INTEGER,
    p.stock,
    p.stock + FLOOR(RANDOM() * 20 + 1)::INTEGER,
    'Sample inventory movement',
    'adjustment',
    (SELECT id FROM profiles WHERE is_admin = true LIMIT 1)
FROM products p
WHERE p.is_active = true
LIMIT 50;

-- Create default user security settings for existing users
INSERT INTO user_security_settings (user_id, two_factor_enabled, login_alerts, suspicious_activity_alerts)
SELECT 
    id,
    false,
    true,
    true
FROM profiles
WHERE NOT EXISTS (
    SELECT 1 FROM user_security_settings WHERE user_id = profiles.id
);

-- Update statistics
SELECT 'Sample data for missing tables inserted successfully!' as message,
       (SELECT COUNT(*) FROM system_settings) as system_settings_count,
       (SELECT COUNT(*) FROM email_templates) as email_templates_count,
       (SELECT COUNT(*) FROM feature_flags) as feature_flags_count,
       (SELECT COUNT(*) FROM notifications) as notifications_count,
       (SELECT COUNT(*) FROM sales_analytics) as sales_analytics_count,
       (SELECT COUNT(*) FROM user_activity_logs) as activity_logs_count;
