-- ==========================================
-- 06-shopping-cart.sql
-- Shopping cart functionality
-- ==========================================

-- Create cart items table
CREATE TABLE IF NOT EXISTS public.cart_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for cart items
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON public.cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON public.cart_items(product_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_variant_id ON public.cart_items(variant_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_created_at ON public.cart_items(created_at);

-- Enable RLS on cart items
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

-- Create policies for cart items
CREATE POLICY "Users can view their own cart items" ON public.cart_items
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cart items" ON public.cart_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cart items" ON public.cart_items
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cart items" ON public.cart_items
  FOR DELETE USING (auth.uid() = user_id);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cart_items TO authenticated;
GRANT ALL ON public.cart_items TO service_role;

-- Create trigger for cart items updated_at
DROP TRIGGER IF EXISTS update_cart_items_updated_at ON public.cart_items;
CREATE TRIGGER update_cart_items_updated_at
  BEFORE UPDATE ON public.cart_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ==========================================
-- Cart Helper Functions
-- ==========================================

-- Function to calculate cart item total price
CREATE OR REPLACE FUNCTION public.calculate_cart_item_total()
RETURNS TRIGGER AS $$
BEGIN
  -- Get the current price of the product/variant
  IF NEW.variant_id IS NOT NULL THEN
    SELECT 
      CASE 
        WHEN pv.price_adjustment != 0 THEN p.price + pv.price_adjustment
        ELSE p.price
      END
    INTO NEW.unit_price
    FROM public.products p
    JOIN public.product_variants pv ON pv.id = NEW.variant_id
    WHERE p.id = NEW.product_id AND pv.id = NEW.variant_id;
  ELSE
    SELECT price INTO NEW.unit_price FROM public.products WHERE id = NEW.product_id;
  END IF;
  
  -- Calculate total price
  NEW.total_price := NEW.unit_price * NEW.quantity;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for cart item price calculation
DROP TRIGGER IF EXISTS calculate_cart_item_total_trigger ON public.cart_items;
CREATE TRIGGER calculate_cart_item_total_trigger
  BEFORE INSERT OR UPDATE ON public.cart_items
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_cart_item_total();

-- ==========================================
-- Cart Statistics View
-- ==========================================

-- Create a view for cart statistics
CREATE OR REPLACE VIEW public.cart_stats AS
SELECT 
  user_id,
  COUNT(*) as item_count,
  SUM(quantity) as total_quantity,
  SUM(total_price) as cart_total
FROM public.cart_items
GROUP BY user_id;

-- Grant permissions on the view
GRANT SELECT ON public.cart_stats TO authenticated;

-- ==========================================
-- Cart Management Functions
-- ==========================================

-- Function to add item to cart
CREATE OR REPLACE FUNCTION public.add_to_cart(
  p_product_id UUID,
  p_variant_id UUID DEFAULT NULL,
  p_quantity INTEGER DEFAULT 1
)
RETURNS TABLE(success BOOLEAN, message TEXT) AS $$
DECLARE
  v_current_quantity INTEGER;
  v_stock INTEGER;
  v_unit_price DECIMAL(10, 2);
BEGIN
  -- Check stock availability
  IF p_variant_id IS NOT NULL THEN
    SELECT stock INTO v_stock FROM public.product_variants WHERE id = p_variant_id;
  ELSE
    SELECT stock INTO v_stock FROM public.products WHERE id = p_product_id;
  END IF;
  
  IF v_stock < p_quantity THEN
    RETURN QUERY SELECT FALSE, 'Insufficient stock available';
    RETURN;
  END IF;
  
  -- Check if item already exists in cart
  SELECT quantity INTO v_current_quantity
  FROM public.cart_items
  WHERE user_id = auth.uid() 
    AND product_id = p_product_id 
    AND (variant_id = p_variant_id OR (variant_id IS NULL AND p_variant_id IS NULL));
  
  IF v_current_quantity IS NOT NULL THEN
    -- Update existing item quantity
    UPDATE public.cart_items
    SET quantity = v_current_quantity + p_quantity,
        updated_at = NOW()
    WHERE user_id = auth.uid() 
      AND product_id = p_product_id 
      AND (variant_id = p_variant_id OR (variant_id IS NULL AND p_variant_id IS NULL));
  ELSE
    -- Insert new item
    INSERT INTO public.cart_items (user_id, product_id, variant_id, quantity)
    VALUES (auth.uid(), p_product_id, p_variant_id, p_quantity);
  END IF;
  
  RETURN QUERY SELECT TRUE, 'Item added to cart successfully';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clear user cart
CREATE OR REPLACE FUNCTION public.clear_cart()
RETURNS BOOLEAN AS $$
BEGIN
  DELETE FROM public.cart_items WHERE user_id = auth.uid();
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;