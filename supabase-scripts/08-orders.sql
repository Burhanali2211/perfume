-- ==========================================
-- 08-orders.sql
-- Order management functionality
-- ==========================================

-- Create orders table
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  guest_email TEXT,
  guest_name TEXT,
  subtotal DECIMAL(10, 2) NOT NULL,
  tax_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  shipping_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  discount_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  total_amount DECIMAL(10, 2) NOT NULL,
  status TEXT CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')) DEFAULT 'pending',
  payment_status TEXT CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')) DEFAULT 'pending',
  payment_method TEXT,
  payment_id TEXT,
  currency TEXT DEFAULT 'USD',
  shipping_address JSONB,
  billing_address JSONB,
  notes TEXT,
  tracking_number TEXT,
  shipped_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for orders
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_guest_email ON public.orders(guest_email);

-- Enable RLS on orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Create policies for orders
CREATE POLICY "Users can view their own orders" ON public.orders
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Admins can view all orders" ON public.orders
  FOR SELECT USING (public.is_admin(auth.uid()));

CREATE POLICY "Users can insert their own orders" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Admins can update orders" ON public.orders
  FOR UPDATE USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete orders" ON public.orders
  FOR DELETE USING (public.is_admin(auth.uid()));

-- Grant permissions
GRANT SELECT, INSERT ON public.orders TO authenticated;
GRANT UPDATE, DELETE ON public.orders TO service_role;
GRANT ALL ON public.orders TO service_role;

-- Create trigger for orders updated_at
DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ==========================================
-- Order Items
-- ==========================================

-- Create order items table
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  product_snapshot JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for order items
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_order_items_variant_id ON public.order_items(variant_id);
CREATE INDEX IF NOT EXISTS idx_order_items_created_at ON public.order_items(created_at);

-- Enable RLS on order items
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Create policies for order items
CREATE POLICY "Users can view order items for their orders" ON public.order_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND (o.user_id = auth.uid() OR o.user_id IS NULL))
  );

CREATE POLICY "Admins can view all order items" ON public.order_items
  FOR SELECT USING (public.is_admin(auth.uid()));

CREATE POLICY "Service role can insert order items" ON public.order_items
  FOR INSERT WITH CHECK (TRUE);

-- Grant permissions
GRANT SELECT ON public.order_items TO authenticated;
GRANT INSERT ON public.order_items TO service_role;
GRANT ALL ON public.order_items TO service_role;

-- ==========================================
-- Order Tracking
-- ==========================================

-- Create order tracking table
CREATE TABLE IF NOT EXISTS public.order_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  message TEXT,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for order tracking
CREATE INDEX IF NOT EXISTS idx_order_tracking_order_id ON public.order_tracking(order_id);
CREATE INDEX IF NOT EXISTS idx_order_tracking_status ON public.order_tracking(status);
CREATE INDEX IF NOT EXISTS idx_order_tracking_created_at ON public.order_tracking(created_at);

-- Enable RLS on order tracking
ALTER TABLE public.order_tracking ENABLE ROW LEVEL SECURITY;

-- Create policies for order tracking
CREATE POLICY "Users can view tracking for their orders" ON public.order_tracking
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND (o.user_id = auth.uid() OR o.user_id IS NULL))
  );

CREATE POLICY "Admins can manage order tracking" ON public.order_tracking
  FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Service role can insert order tracking" ON public.order_tracking
  FOR INSERT WITH CHECK (TRUE);

-- Grant permissions
GRANT SELECT ON public.order_tracking TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.order_tracking TO service_role;
GRANT ALL ON public.order_tracking TO service_role;

-- ==========================================
-- Order Helper Functions
-- ==========================================

-- Function to generate order number
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TEXT AS $$
BEGIN
  RETURN 'ORD' || TO_CHAR(NOW(), 'YYYYMMDD') || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Function to update product stock when order is confirmed
CREATE OR REPLACE FUNCTION public.update_stock_on_order_confirmation()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process when order status changes to confirmed, processing, or shipped
  IF NEW.status IN ('confirmed', 'processing', 'shipped') AND 
     (OLD.status IS NULL OR OLD.status NOT IN ('confirmed', 'processing', 'shipped')) THEN
    
    -- Decrease stock for each order item
    INSERT INTO public.inventory_transactions (
      product_id, 
      variant_id, 
      transaction_type, 
      quantity, 
      reason, 
      reference_type, 
      reference_id, 
      created_by
    )
    SELECT 
      oi.product_id,
      oi.variant_id,
      'out',
      oi.quantity,
      'Order confirmation: ' || NEW.order_number,
      'order',
      NEW.id,
      NEW.user_id
    FROM public.order_items oi
    WHERE oi.order_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for stock update on order confirmation
DROP TRIGGER IF EXISTS update_stock_on_order_confirmation_trigger ON public.orders;
CREATE TRIGGER update_stock_on_order_confirmation_trigger
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_stock_on_order_confirmation();

-- ==========================================
-- Order Statistics Views
-- ==========================================

-- Create a view for order statistics
CREATE OR REPLACE VIEW public.order_stats AS
SELECT 
  DATE_TRUNC('day', created_at) as order_date,
  COUNT(*) as order_count,
  SUM(total_amount) as total_revenue,
  AVG(total_amount) as average_order_value,
  COUNT(DISTINCT user_id) as unique_customers
FROM public.orders
WHERE status NOT IN ('cancelled', 'refunded')
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY order_date DESC;

-- Grant permissions on the view
GRANT SELECT ON public.order_stats TO service_role;

-- Create a view for order details
CREATE OR REPLACE VIEW public.order_details AS
SELECT 
  o.id,
  o.order_number,
  o.user_id,
  o.status,
  o.payment_status,
  o.total_amount,
  o.created_at,
  p.full_name as customer_name,
  p.email as customer_email
FROM public.orders o
LEFT JOIN public.profiles p ON o.user_id = p.id;

-- Grant permissions on the view
GRANT SELECT ON public.order_details TO service_role;