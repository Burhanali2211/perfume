-- ==========================================
-- 10-coupons.sql
-- Coupon and discount system
-- ==========================================

-- Create coupons table
CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT CHECK (type IN ('percentage', 'fixed')) NOT NULL,
  value DECIMAL(10, 2) NOT NULL,
  minimum_amount DECIMAL(10, 2) DEFAULT 0.00,
  maximum_discount DECIMAL(10, 2),
  usage_limit INTEGER,
  used_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  valid_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for coupons
CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_type ON public.coupons(type);
CREATE INDEX IF NOT EXISTS idx_coupons_is_active ON public.coupons(is_active);
CREATE INDEX IF NOT EXISTS idx_coupons_valid_from ON public.coupons(valid_from);
CREATE INDEX IF NOT EXISTS idx_coupons_valid_until ON public.coupons(valid_until);
CREATE INDEX IF NOT EXISTS idx_coupons_created_at ON public.coupons(created_at);

-- Enable RLS on coupons
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Create policies for coupons
CREATE POLICY "Active coupons are viewable by everyone" ON public.coupons
  FOR SELECT USING (is_active = true AND valid_from <= NOW() AND (valid_until IS NULL OR valid_until >= NOW()));

CREATE POLICY "Admins can manage all coupons" ON public.coupons
  FOR ALL USING (public.is_admin(auth.uid()));

-- Grant permissions
GRANT SELECT ON public.coupons TO anon, authenticated;
GRANT ALL ON public.coupons TO service_role;

-- Create trigger for coupons updated_at
DROP TRIGGER IF EXISTS update_coupons_updated_at ON public.coupons;
CREATE TRIGGER update_coupons_updated_at
  BEFORE UPDATE ON public.coupons
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ==========================================
-- Coupon Usage Tracking
-- ==========================================

-- Create coupon usage table
CREATE TABLE IF NOT EXISTS public.coupon_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coupon_id UUID REFERENCES public.coupons(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  discount_amount DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for coupon usage
CREATE INDEX IF NOT EXISTS idx_coupon_usage_coupon_id ON public.coupon_usage(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_user_id ON public.coupon_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_order_id ON public.coupon_usage(order_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_created_at ON public.coupon_usage(created_at);

-- Enable RLS on coupon usage
ALTER TABLE public.coupon_usage ENABLE ROW LEVEL SECURITY;

-- Create policies for coupon usage
CREATE POLICY "Users can view their own coupon usage" ON public.coupon_usage
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all coupon usage" ON public.coupon_usage
  FOR SELECT USING (public.is_admin(auth.uid()));

CREATE POLICY "Service role can insert coupon usage" ON public.coupon_usage
  FOR INSERT WITH CHECK (TRUE);

-- Grant permissions
GRANT SELECT ON public.coupon_usage TO authenticated;
GRANT INSERT ON public.coupon_usage TO service_role;
GRANT ALL ON public.coupon_usage TO service_role;

-- ==========================================
-- Coupon Helper Functions
-- ==========================================

-- Function to validate coupon
CREATE OR REPLACE FUNCTION public.validate_coupon(coupon_code TEXT, order_amount DECIMAL(10, 2))
RETURNS TABLE(
  is_valid BOOLEAN,
  discount_amount DECIMAL(10, 2),
  error_message TEXT
) AS $$
DECLARE
  coupon_record RECORD;
BEGIN
  -- Get coupon details
  SELECT * INTO coupon_record
  FROM public.coupons
  WHERE code = UPPER(coupon_code)
    AND is_active = true
    AND valid_from <= NOW()
    AND (valid_until IS NULL OR valid_until >= NOW())
    AND (usage_limit IS NULL OR used_count < usage_limit)
    AND order_amount >= minimum_amount;
  
  -- Check if coupon exists
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 0.00, 'Invalid or expired coupon code';
    RETURN;
  END IF;
  
  -- Calculate discount amount
  IF coupon_record.type = 'percentage' THEN
    discount_amount := (order_amount * coupon_record.value / 100);
    IF coupon_record.maximum_discount IS NOT NULL THEN
      discount_amount := LEAST(discount_amount, coupon_record.maximum_discount);
    END IF;
  ELSE -- fixed discount
    discount_amount := LEAST(coupon_record.value, order_amount);
  END IF;
  
  RETURN QUERY SELECT TRUE, discount_amount, NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to apply coupon to order
CREATE OR REPLACE FUNCTION public.apply_coupon_to_order(coupon_code TEXT, order_id UUID)
RETURNS TABLE(success BOOLEAN, message TEXT) AS $$
DECLARE
  coupon_record RECORD;
  order_record RECORD;
  discount_amount DECIMAL(10, 2);
BEGIN
  -- Get coupon details
  SELECT * INTO coupon_record
  FROM public.coupons
  WHERE code = UPPER(coupon_code)
    AND is_active = true
    AND valid_from <= NOW()
    AND (valid_until IS NULL OR valid_until >= NOW())
    AND (usage_limit IS NULL OR used_count < usage_limit);
  
  -- Check if coupon exists
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 'Invalid or expired coupon code';
    RETURN;
  END IF;
  
  -- Get order details
  SELECT * INTO order_record
  FROM public.orders
  WHERE id = order_id;
  
  -- Check minimum amount
  IF order_record.total_amount < coupon_record.minimum_amount THEN
    RETURN QUERY SELECT FALSE, 'Order amount does not meet minimum requirement for this coupon';
    RETURN;
  END IF;
  
  -- Calculate discount amount
  IF coupon_record.type = 'percentage' THEN
    discount_amount := (order_record.total_amount * coupon_record.value / 100);
    IF coupon_record.maximum_discount IS NOT NULL THEN
      discount_amount := LEAST(discount_amount, coupon_record.maximum_discount);
    END IF;
  ELSE -- fixed discount
    discount_amount := LEAST(coupon_record.value, order_record.total_amount);
  END IF;
  
  -- Update order with discount
  UPDATE public.orders
  SET discount_amount = discount_amount,
      total_amount = total_amount - discount_amount
  WHERE id = order_id;
  
  -- Record coupon usage
  INSERT INTO public.coupon_usage (coupon_id, user_id, order_id, discount_amount)
  VALUES (coupon_record.id, order_record.user_id, order_id, discount_amount);
  
  -- Increment coupon usage count
  UPDATE public.coupons
  SET used_count = used_count + 1
  WHERE id = coupon_record.id;
  
  RETURN QUERY SELECT TRUE, 'Coupon applied successfully';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;