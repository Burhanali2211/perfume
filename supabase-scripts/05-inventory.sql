-- ==========================================
-- 05-inventory.sql
-- Inventory tracking and management
-- ==========================================

-- Create inventory transactions table
CREATE TABLE IF NOT EXISTS public.inventory_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE CASCADE,
  transaction_type TEXT CHECK (transaction_type IN ('in', 'out', 'adjustment')) NOT NULL,
  quantity INTEGER NOT NULL,
  reason TEXT,
  reference_type TEXT,
  reference_id UUID,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for inventory transactions
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_product_id ON public.inventory_transactions(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_variant_id ON public.inventory_transactions(variant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_transaction_type ON public.inventory_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_created_by ON public.inventory_transactions(created_by);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_created_at ON public.inventory_transactions(created_at);

-- Enable RLS on inventory transactions
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;

-- Create policies for inventory transactions
CREATE POLICY "Admins and sellers can view inventory transactions" ON public.inventory_transactions
  FOR SELECT USING (public.is_admin(auth.uid()) OR public.is_seller(auth.uid()));

CREATE POLICY "Admins and sellers can create inventory transactions" ON public.inventory_transactions
  FOR INSERT WITH CHECK (public.is_admin(auth.uid()) OR public.is_seller(auth.uid()));

CREATE POLICY "Admins can update inventory transactions" ON public.inventory_transactions
  FOR UPDATE USING (public.is_admin(auth.uid()));

CREATE POLICY "Only admins can delete inventory transactions" ON public.inventory_transactions
  FOR DELETE USING (public.is_admin(auth.uid()));

-- Grant permissions
GRANT SELECT ON public.inventory_transactions TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.inventory_transactions TO authenticated;
GRANT ALL ON public.inventory_transactions TO service_role;

-- ==========================================
-- Inventory Helper Functions
-- ==========================================

-- Function to update product stock based on inventory transactions
CREATE OR REPLACE FUNCTION public.update_product_stock()
RETURNS TRIGGER AS $$
BEGIN
  -- Update product stock if this is for a product (not a variant)
  IF NEW.product_id IS NOT NULL AND NEW.variant_id IS NULL THEN
    IF NEW.transaction_type = 'in' THEN
      UPDATE public.products 
      SET stock = stock + NEW.quantity 
      WHERE id = NEW.product_id;
    ELSIF NEW.transaction_type IN ('out', 'adjustment') THEN
      UPDATE public.products 
      SET stock = stock - NEW.quantity 
      WHERE id = NEW.product_id;
    END IF;
  -- Update variant stock if this is for a variant
  ELSIF NEW.variant_id IS NOT NULL THEN
    IF NEW.transaction_type = 'in' THEN
      UPDATE public.product_variants 
      SET stock = stock + NEW.quantity 
      WHERE id = NEW.variant_id;
      
      -- Also update the parent product stock
      UPDATE public.products 
      SET stock = stock + NEW.quantity 
      WHERE id = (
        SELECT product_id FROM public.product_variants WHERE id = NEW.variant_id
      );
    ELSIF NEW.transaction_type IN ('out', 'adjustment') THEN
      UPDATE public.product_variants 
      SET stock = stock - NEW.quantity 
      WHERE id = NEW.variant_id;
      
      -- Also update the parent product stock
      UPDATE public.products 
      SET stock = stock - NEW.quantity 
      WHERE id = (
        SELECT product_id FROM public.product_variants WHERE id = NEW.variant_id
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for inventory transactions
DROP TRIGGER IF EXISTS update_product_stock_trigger ON public.inventory_transactions;
CREATE TRIGGER update_product_stock_trigger
  AFTER INSERT ON public.inventory_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_product_stock();

-- ==========================================
-- Low Stock Alerts
-- ==========================================

-- Create low stock alerts table
CREATE TABLE IF NOT EXISTS public.low_stock_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE CASCADE,
  current_stock INTEGER NOT NULL,
  min_stock_level INTEGER NOT NULL,
  alert_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for low stock alerts
CREATE INDEX IF NOT EXISTS idx_low_stock_alerts_product_id ON public.low_stock_alerts(product_id);
CREATE INDEX IF NOT EXISTS idx_low_stock_alerts_variant_id ON public.low_stock_alerts(variant_id);
CREATE INDEX IF NOT EXISTS idx_low_stock_alerts_alert_sent ON public.low_stock_alerts(alert_sent);
CREATE INDEX IF NOT EXISTS idx_low_stock_alerts_created_at ON public.low_stock_alerts(created_at);
CREATE INDEX IF NOT EXISTS idx_low_stock_alerts_resolved_at ON public.low_stock_alerts(resolved_at);

-- Enable RLS on low stock alerts
ALTER TABLE public.low_stock_alerts ENABLE ROW LEVEL SECURITY;

-- Create policies for low stock alerts
CREATE POLICY "Admins and sellers can view low stock alerts" ON public.low_stock_alerts
  FOR SELECT USING (public.is_admin(auth.uid()) OR public.is_seller(auth.uid()));

CREATE POLICY "Admins and sellers can update low stock alerts" ON public.low_stock_alerts
  FOR UPDATE USING (public.is_admin(auth.uid()) OR public.is_seller(auth.uid()));

CREATE POLICY "Only admins can delete low stock alerts" ON public.low_stock_alerts
  FOR DELETE USING (public.is_admin(auth.uid()));

-- Grant permissions
GRANT SELECT, UPDATE, DELETE ON public.low_stock_alerts TO authenticated;
GRANT ALL ON public.low_stock_alerts TO service_role;

-- ==========================================
-- Inventory Views
-- ==========================================

-- Create a view for current inventory levels
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

-- Grant permissions on the view
GRANT SELECT ON public.current_inventory TO authenticated;