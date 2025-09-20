-- ==========================================
-- 04-products.sql
-- Products and product variants management
-- ==========================================

-- Create products table
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  description TEXT,
  short_description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  original_price DECIMAL(10, 2),
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  seller_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  images TEXT[],
  stock INTEGER DEFAULT 0,
  min_stock_level INTEGER DEFAULT 5,
  sku TEXT UNIQUE,
  weight DECIMAL(8, 3),
  dimensions JSONB,
  tags TEXT[],
  specifications JSONB,
  rating DECIMAL(3, 2) DEFAULT 0.00,
  review_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  meta_title TEXT,
  meta_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_seller_id ON public.products(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON public.products(is_featured);
CREATE INDEX IF NOT EXISTS idx_products_price ON public.products(price);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON public.products(created_at);
CREATE INDEX IF NOT EXISTS idx_products_tags ON public.products USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_products_name_search ON public.products USING GIN(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_products_description_search ON public.products USING GIN(to_tsvector('english', description));

-- Enable RLS on products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Create policies for products
CREATE POLICY "Active products are viewable by everyone" ON public.products
  FOR SELECT USING (is_active = true);

CREATE POLICY "Sellers can insert their own products" ON public.products
  FOR INSERT WITH CHECK (auth.uid() = seller_id OR public.is_admin(auth.uid()));

CREATE POLICY "Sellers can update their own products" ON public.products
  FOR UPDATE USING (auth.uid() = seller_id OR public.is_admin(auth.uid()));

CREATE POLICY "Sellers can delete their own products" ON public.products
  FOR DELETE USING (auth.uid() = seller_id OR public.is_admin(auth.uid()));

CREATE POLICY "Admins can view all products" ON public.products
  FOR SELECT USING (public.is_admin(auth.uid()));

-- Grant permissions
GRANT SELECT ON public.products TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;

-- Create trigger for products updated_at
DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ==========================================
-- Product Variants
-- ==========================================

-- Create product variants table
CREATE TABLE IF NOT EXISTS public.product_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  value TEXT NOT NULL,
  price_adjustment DECIMAL(10, 2) DEFAULT 0.00,
  stock INTEGER DEFAULT 0,
  sku TEXT UNIQUE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for product variants
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON public.product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_sku ON public.product_variants(sku);
CREATE INDEX IF NOT EXISTS idx_product_variants_is_active ON public.product_variants(is_active);
CREATE INDEX IF NOT EXISTS idx_product_variants_created_at ON public.product_variants(created_at);

-- Enable RLS on product variants
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

-- Create policies for product variants
CREATE POLICY "Active product variants are viewable by everyone" ON public.product_variants
  FOR SELECT USING (
    is_active = true AND 
    EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND p.is_active = true)
  );

CREATE POLICY "Sellers can manage variants for their own products" ON public.product_variants
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND p.seller_id = auth.uid()) OR
    public.is_admin(auth.uid())
  );

-- Grant permissions
GRANT SELECT ON public.product_variants TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.product_variants TO authenticated;
GRANT ALL ON public.product_variants TO service_role;

-- Create trigger for product variants updated_at
DROP TRIGGER IF EXISTS update_product_variants_updated_at ON public.product_variants;
CREATE TRIGGER update_product_variants_updated_at
  BEFORE UPDATE ON public.product_variants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ==========================================
-- Product Helper Functions
-- ==========================================

-- Function to automatically set slug if not provided
CREATE OR REPLACE FUNCTION public.set_product_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := LOWER(
      REGEXP_REPLACE(
        REGEXP_REPLACE(NEW.name, '[^a-zA-Z0-9\s]', '', 'g'),
        '\s+', '-', 'g'
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for product slug generation
DROP TRIGGER IF EXISTS set_product_slug_trigger ON public.products;
CREATE TRIGGER set_product_slug_trigger
  BEFORE INSERT OR UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.set_product_slug();

-- Function to update product rating and review count
CREATE OR REPLACE FUNCTION public.update_product_rating()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.products 
    SET 
      rating = (
        (rating * review_count + NEW.rating) / (review_count + 1)
      ),
      review_count = review_count + 1
    WHERE id = NEW.product_id;
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE public.products 
    SET 
      rating = (
        (rating * review_count - OLD.rating + NEW.rating) / review_count
      )
    WHERE id = NEW.product_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.products 
    SET 
      rating = CASE 
        WHEN review_count <= 1 THEN 0 
        ELSE (rating * review_count - OLD.rating) / (review_count - 1) 
      END,
      review_count = GREATEST(review_count - 1, 0)
    WHERE id = OLD.product_id;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- Product Statistics View
-- ==========================================

-- Create a view for product statistics
CREATE OR REPLACE VIEW public.product_stats AS
SELECT 
  p.id,
  p.name,
  p.category_id,
  c.name as category_name,
  p.seller_id,
  pr.full_name as seller_name,
  p.price,
  p.stock,
  p.rating,
  p.review_count,
  p.is_featured,
  p.created_at
FROM public.products p
LEFT JOIN public.categories c ON p.category_id = c.id
LEFT JOIN public.profiles pr ON p.seller_id = pr.id
WHERE p.is_active = true;

-- Grant permissions on the view
GRANT SELECT ON public.product_stats TO anon, authenticated;