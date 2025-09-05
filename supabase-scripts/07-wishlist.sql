-- ==========================================
-- 07-wishlist.sql
-- Wishlist functionality
-- ==========================================

-- Create wishlist items table
CREATE TABLE IF NOT EXISTS public.wishlist_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for wishlist items
CREATE INDEX IF NOT EXISTS idx_wishlist_items_user_id ON public.wishlist_items(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_items_product_id ON public.wishlist_items(product_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_items_created_at ON public.wishlist_items(created_at);

-- Ensure unique constraint for user-product combinations
CREATE UNIQUE INDEX IF NOT EXISTS idx_wishlist_user_product ON public.wishlist_items(user_id, product_id);

-- Enable RLS on wishlist items
ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;

-- Create policies for wishlist items
CREATE POLICY "Users can view their own wishlist items" ON public.wishlist_items
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own wishlist items" ON public.wishlist_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own wishlist items" ON public.wishlist_items
  FOR DELETE USING (auth.uid() = user_id);

-- Grant permissions
GRANT SELECT, INSERT, DELETE ON public.wishlist_items TO authenticated;
GRANT ALL ON public.wishlist_items TO service_role;

-- ==========================================
-- Wishlist Statistics View
-- ==========================================

-- Create a view for wishlist statistics
CREATE OR REPLACE VIEW public.wishlist_stats AS
SELECT 
  product_id,
  COUNT(*) as wishlist_count
FROM public.wishlist_items
GROUP BY product_id;

-- Grant permissions on the view
GRANT SELECT ON public.wishlist_stats TO anon, authenticated;

-- ==========================================
-- Wishlist Helper Functions
-- ==========================================

-- Function to get user's wishlist with product details
CREATE OR REPLACE FUNCTION public.get_user_wishlist()
RETURNS TABLE(
  id UUID,
  product_id UUID,
  product_name TEXT,
  product_price DECIMAL(10, 2),
  product_image TEXT,
  product_rating DECIMAL(3, 2),
  added_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    wi.id,
    wi.product_id,
    p.name as product_name,
    p.price as product_price,
    p.images[1] as product_image,
    p.rating as product_rating,
    wi.created_at as added_at
  FROM public.wishlist_items wi
  JOIN public.products p ON wi.product_id = p.id
  WHERE wi.user_id = auth.uid() AND p.is_active = true
  ORDER BY wi.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if product is in user's wishlist
CREATE OR REPLACE FUNCTION public.is_product_in_wishlist(p_product_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.wishlist_items 
    WHERE user_id = auth.uid() AND product_id = p_product_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;