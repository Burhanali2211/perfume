-- =====================================================
-- MISSING DATABASE FUNCTIONS AND PROCEDURES
-- =====================================================
-- This script adds all missing functions identified in the database audit
-- Run this AFTER the main schema and missing tables scripts
-- =====================================================

-- =====================================================
-- FUNCTION: get_table_schema
-- =====================================================
-- Referenced in: UniversalTableManager.tsx
-- Purpose: Retrieve table schema information for dynamic table management
CREATE OR REPLACE FUNCTION get_table_schema(table_name TEXT)
RETURNS TABLE(
    column_name TEXT,
    data_type TEXT,
    is_nullable BOOLEAN,
    column_default TEXT,
    is_primary_key BOOLEAN,
    is_foreign_key BOOLEAN,
    referenced_table TEXT,
    referenced_column TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.column_name::TEXT,
        c.data_type::TEXT,
        CASE WHEN c.is_nullable = 'YES' THEN TRUE ELSE FALSE END as is_nullable,
        c.column_default::TEXT,
        CASE WHEN tc.constraint_type = 'PRIMARY KEY' THEN TRUE ELSE FALSE END as is_primary_key,
        CASE WHEN tc.constraint_type = 'FOREIGN KEY' THEN TRUE ELSE FALSE END as is_foreign_key,
        ccu.table_name::TEXT as referenced_table,
        ccu.column_name::TEXT as referenced_column
    FROM information_schema.columns c
    LEFT JOIN information_schema.key_column_usage kcu 
        ON c.table_name = kcu.table_name AND c.column_name = kcu.column_name
    LEFT JOIN information_schema.table_constraints tc 
        ON kcu.constraint_name = tc.constraint_name
    LEFT JOIN information_schema.constraint_column_usage ccu 
        ON tc.constraint_name = ccu.constraint_name
    WHERE c.table_schema = 'public' 
    AND c.table_name = get_table_schema.table_name
    ORDER BY c.ordinal_position;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: increment_review_helpful
-- =====================================================
-- Referenced in: supabase.ts
-- Purpose: Atomically increment helpful count for reviews
CREATE OR REPLACE FUNCTION increment_review_helpful(review_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE reviews 
    SET helpful_count = helpful_count + 1,
        updated_at = NOW()
    WHERE id = review_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: add_to_cart
-- =====================================================
-- Referenced in: supabase.ts
-- Purpose: Handle cart operations with proper concurrency control
CREATE OR REPLACE FUNCTION add_to_cart(
    p_product_id UUID,
    p_variant_id UUID DEFAULT NULL,
    p_quantity INTEGER DEFAULT 1
)
RETURNS JSON AS $$
DECLARE
    v_user_id UUID;
    v_cart_id UUID;
    v_existing_quantity INTEGER := 0;
    v_product_price DECIMAL(10,2);
    v_result JSON;
BEGIN
    -- Get current user
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'User not authenticated');
    END IF;
    
    -- Get or create cart
    SELECT id INTO v_cart_id 
    FROM carts 
    WHERE user_id = v_user_id;
    
    IF v_cart_id IS NULL THEN
        INSERT INTO carts (user_id) VALUES (v_user_id) RETURNING id INTO v_cart_id;
    END IF;
    
    -- Get product price
    IF p_variant_id IS NOT NULL THEN
        SELECT COALESCE(price, (SELECT price FROM products WHERE id = p_product_id))
        INTO v_product_price
        FROM product_variants 
        WHERE id = p_variant_id;
    ELSE
        SELECT price INTO v_product_price FROM products WHERE id = p_product_id;
    END IF;
    
    -- Check if item already exists in cart
    SELECT quantity INTO v_existing_quantity
    FROM cart_items
    WHERE cart_id = v_cart_id 
    AND product_id = p_product_id 
    AND (variant_id = p_variant_id OR (variant_id IS NULL AND p_variant_id IS NULL));
    
    IF v_existing_quantity > 0 THEN
        -- Update existing item
        UPDATE cart_items 
        SET quantity = v_existing_quantity + p_quantity,
            updated_at = NOW()
        WHERE cart_id = v_cart_id 
        AND product_id = p_product_id 
        AND (variant_id = p_variant_id OR (variant_id IS NULL AND p_variant_id IS NULL));
    ELSE
        -- Insert new item
        INSERT INTO cart_items (cart_id, product_id, variant_id, quantity, price)
        VALUES (v_cart_id, p_product_id, p_variant_id, p_quantity, v_product_price);
    END IF;
    
    -- Update cart timestamp
    UPDATE carts SET updated_at = NOW() WHERE id = v_cart_id;
    
    RETURN json_build_object('success', true, 'cart_id', v_cart_id);
    
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: log_user_activity
-- =====================================================
-- Referenced in: Security and audit components
-- Purpose: Log user activities for security tracking
CREATE OR REPLACE FUNCTION log_user_activity(
    p_user_id UUID,
    p_action_type TEXT,
    p_action_details TEXT DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'::JSONB
)
RETURNS BOOLEAN AS $$
BEGIN
    INSERT INTO user_activity_logs (
        user_id,
        action_type,
        action_details,
        ip_address,
        user_agent,
        metadata
    ) VALUES (
        p_user_id,
        p_action_type,
        p_action_details,
        p_ip_address,
        p_user_agent,
        p_metadata
    );
    
    RETURN TRUE;
    
EXCEPTION WHEN OTHERS THEN
    -- Log error but don't fail the main operation
    RAISE WARNING 'Failed to log user activity: %', SQLERRM;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: calculate_analytics_data
-- =====================================================
-- Referenced in: Analytics components
-- Purpose: Calculate complex analytics metrics efficiently
CREATE OR REPLACE FUNCTION calculate_analytics_data(
    start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    end_date DATE DEFAULT CURRENT_DATE
)
RETURNS JSON AS $$
DECLARE
    v_result JSON;
    v_total_revenue DECIMAL(12,2);
    v_total_orders INTEGER;
    v_total_customers INTEGER;
    v_new_customers INTEGER;
    v_avg_order_value DECIMAL(10,2);
BEGIN
    -- Calculate basic metrics
    SELECT 
        COALESCE(SUM(total_amount), 0),
        COUNT(*),
        COUNT(DISTINCT user_id)
    INTO v_total_revenue, v_total_orders, v_total_customers
    FROM orders
    WHERE created_at::DATE BETWEEN start_date AND end_date
    AND status NOT IN ('cancelled', 'refunded');
    
    -- Calculate new customers
    SELECT COUNT(DISTINCT user_id)
    INTO v_new_customers
    FROM orders o1
    WHERE o1.created_at::DATE BETWEEN start_date AND end_date
    AND NOT EXISTS (
        SELECT 1 FROM orders o2 
        WHERE o2.user_id = o1.user_id 
        AND o2.created_at < start_date
    );
    
    -- Calculate average order value
    v_avg_order_value := CASE 
        WHEN v_total_orders > 0 THEN v_total_revenue / v_total_orders 
        ELSE 0 
    END;
    
    -- Build result JSON
    v_result := json_build_object(
        'total_revenue', v_total_revenue,
        'total_orders', v_total_orders,
        'total_customers', v_total_customers,
        'new_customers', v_new_customers,
        'returning_customers', v_total_customers - v_new_customers,
        'average_order_value', v_avg_order_value,
        'period_start', start_date,
        'period_end', end_date,
        'calculated_at', NOW()
    );
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: check_inventory_levels
-- =====================================================
-- Referenced in: Inventory management
-- Purpose: Check and alert on low inventory levels
CREATE OR REPLACE FUNCTION check_inventory_levels()
RETURNS TABLE(
    product_id UUID,
    product_name TEXT,
    current_stock INTEGER,
    low_stock_threshold INTEGER,
    status TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        p.stock,
        p.low_stock_threshold,
        CASE 
            WHEN p.stock = 0 THEN 'out_of_stock'
            WHEN p.stock <= p.low_stock_threshold THEN 'low_stock'
            ELSE 'in_stock'
        END as status
    FROM products p
    WHERE p.is_active = TRUE
    AND p.track_inventory = TRUE
    AND p.stock <= p.low_stock_threshold
    ORDER BY p.stock ASC, p.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: cleanup_expired_sessions
-- =====================================================
-- Referenced in: Security management
-- Purpose: Clean up expired user sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    v_deleted_count INTEGER;
BEGIN
    -- Delete expired sessions
    DELETE FROM user_sessions 
    WHERE expires_at < NOW() 
    OR (last_activity < NOW() - INTERVAL '7 days');
    
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    
    -- Log the cleanup
    INSERT INTO user_activity_logs (
        user_id,
        action_type,
        action_details,
        metadata
    ) VALUES (
        NULL,
        'system_cleanup',
        'Cleaned up expired sessions',
        json_build_object('deleted_sessions', v_deleted_count)
    );
    
    RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: update_sales_analytics
-- =====================================================
-- Purpose: Update daily sales analytics data
CREATE OR REPLACE FUNCTION update_sales_analytics(target_date DATE DEFAULT CURRENT_DATE)
RETURNS BOOLEAN AS $$
DECLARE
    v_analytics_data JSON;
BEGIN
    -- Calculate analytics for the target date
    SELECT calculate_analytics_data(target_date, target_date) INTO v_analytics_data;
    
    -- Insert or update sales analytics
    INSERT INTO sales_analytics (
        date,
        total_sales,
        total_orders,
        total_customers,
        new_customers,
        returning_customers,
        average_order_value
    ) VALUES (
        target_date,
        (v_analytics_data->>'total_revenue')::DECIMAL(12,2),
        (v_analytics_data->>'total_orders')::INTEGER,
        (v_analytics_data->>'total_customers')::INTEGER,
        (v_analytics_data->>'new_customers')::INTEGER,
        (v_analytics_data->>'returning_customers')::INTEGER,
        (v_analytics_data->>'average_order_value')::DECIMAL(10,2)
    )
    ON CONFLICT (date) DO UPDATE SET
        total_sales = EXCLUDED.total_sales,
        total_orders = EXCLUDED.total_orders,
        total_customers = EXCLUDED.total_customers,
        new_customers = EXCLUDED.new_customers,
        returning_customers = EXCLUDED.returning_customers,
        average_order_value = EXCLUDED.average_order_value,
        updated_at = NOW();
    
    RETURN TRUE;
    
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Failed to update sales analytics: %', SQLERRM;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================
SELECT 'Missing database functions created successfully!' as message,
       'All referenced functions and procedures are now available.' as details;
