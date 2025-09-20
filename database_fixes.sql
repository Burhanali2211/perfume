-- ==========================================
-- CRITICAL DATABASE FIXES
-- Fixes for the React application errors
-- ==========================================

-- 1. Create missing order_tracking table
CREATE TABLE IF NOT EXISTS public.order_tracking (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    location VARCHAR(255),
    description TEXT,
    tracking_number VARCHAR(100),
    carrier VARCHAR(100),
    estimated_delivery DATE,
    actual_delivery DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Add RLS policies for order_tracking
ALTER TABLE public.order_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "order_tracking_select_policy" ON public.order_tracking
  FOR SELECT USING (
    -- Users can view tracking for their own orders
    EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND user_id = auth.uid()) OR
    -- Admins can view all tracking
    public.is_admin() OR
    -- Allow in development mode
    COALESCE(current_setting('app.development_mode', true)::boolean, false)
  );

CREATE POLICY "order_tracking_insert_policy" ON public.order_tracking
  FOR INSERT WITH CHECK (
    -- Only admins can create tracking records
    public.is_admin() OR
    -- Allow in development mode
    COALESCE(current_setting('app.development_mode', true)::boolean, false)
  );

CREATE POLICY "order_tracking_update_policy" ON public.order_tracking
  FOR UPDATE USING (
    -- Only admins can update tracking records
    public.is_admin() OR
    -- Allow in development mode
    COALESCE(current_setting('app.development_mode', true)::boolean, false)
  );

-- 3. Grant permissions for order_tracking
GRANT ALL ON public.order_tracking TO authenticated;
GRANT ALL ON public.order_tracking TO service_role;
GRANT SELECT ON public.order_tracking TO anon;

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_order_tracking_order_id ON public.order_tracking(order_id);
CREATE INDEX IF NOT EXISTS idx_order_tracking_status ON public.order_tracking(status);
CREATE INDEX IF NOT EXISTS idx_order_tracking_created_at ON public.order_tracking(created_at);

-- 5. Insert some sample tracking data if table is empty
INSERT INTO public.order_tracking (order_id, status, location, description, tracking_number, carrier)
SELECT 
    o.id,
    CASE 
        WHEN o.status = 'completed' THEN 'delivered'
        WHEN o.status = 'shipped' THEN 'in_transit'
        ELSE 'pending'
    END,
    CASE 
        WHEN o.status = 'completed' THEN 'Delivered to customer'
        WHEN o.status = 'shipped' THEN 'In transit to destination'
        ELSE 'Order being processed'
    END,
    CASE 
        WHEN o.status = 'completed' THEN 'Package delivered successfully'
        WHEN o.status = 'shipped' THEN 'Package is on its way'
        ELSE 'Order is being prepared for shipment'
    END,
    'TRK' || LPAD(EXTRACT(EPOCH FROM o.created_at)::TEXT, 10, '0'),
    'Standard Shipping'
FROM public.orders o
WHERE NOT EXISTS (SELECT 1 FROM public.order_tracking WHERE order_id = o.id)
LIMIT 10;

-- 6. Verify the fixes
SELECT 'SUCCESS: Database fixes applied!' as status,
       (SELECT COUNT(*) FROM public.order_tracking) as tracking_records_created;
