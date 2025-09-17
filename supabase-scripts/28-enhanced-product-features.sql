-- ==========================================
-- 28-enhanced-product-features.sql
-- Enhanced product features: Collections, New Arrivals, and Offers
-- ==========================================

-- ==========================================
-- Collections Table
-- ==========================================

-- Create collections table
CREATE TABLE IF NOT EXISTS public.collections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  short_description TEXT,
  image_url TEXT,
  banner_image_url TEXT,
  type TEXT CHECK (type IN ('seasonal', 'limited', 'signature', 'exclusive', 'heritage', 'modern')) DEFAULT 'signature',
  status TEXT CHECK (status IN ('active', 'inactive', 'coming_soon', 'sold_out')) DEFAULT 'active',
  price DECIMAL(10, 2),
  original_price DECIMAL(10, 2),
  discount_percentage INTEGER DEFAULT 0,
  featured BOOLEAN DEFAULT false,
  is_exclusive BOOLEAN DEFAULT false,
  launch_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  sort_order INTEGER DEFAULT 0,
  tags TEXT[],
  meta_title TEXT,
  meta_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create collection_products junction table
CREATE TABLE IF NOT EXISTS public.collection_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  collection_id UUID REFERENCES public.collections(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(collection_id, product_id)
);

-- ==========================================
-- New Arrivals Table
-- ==========================================

-- Create new_arrivals table
CREATE TABLE IF NOT EXISTS public.new_arrivals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  featured_until TIMESTAMP WITH TIME ZONE,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id)
);

-- ==========================================
-- Offers Table
-- ==========================================

-- Create offers table
CREATE TABLE IF NOT EXISTS public.offers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  short_description TEXT,
  offer_type TEXT CHECK (offer_type IN ('percentage', 'fixed_amount', 'buy_one_get_one', 'free_shipping', 'bundle')) NOT NULL,
  discount_value DECIMAL(10, 2) NOT NULL,
  minimum_order_amount DECIMAL(10, 2) DEFAULT 0.00,
  maximum_discount_amount DECIMAL(10, 2),
  image_url TEXT,
  banner_image_url TEXT,
  terms_and_conditions TEXT,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  usage_limit INTEGER,
  usage_count INTEGER DEFAULT 0,
  user_usage_limit INTEGER DEFAULT 1,
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  valid_until TIMESTAMP WITH TIME ZONE,
  applicable_to TEXT CHECK (applicable_to IN ('all_products', 'specific_products', 'specific_categories', 'specific_collections')) DEFAULT 'all_products',
  sort_order INTEGER DEFAULT 0,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create offer_products junction table (for specific product offers)
CREATE TABLE IF NOT EXISTS public.offer_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  offer_id UUID REFERENCES public.offers(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(offer_id, product_id)
);

-- Create offer_categories junction table (for category-specific offers)
CREATE TABLE IF NOT EXISTS public.offer_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  offer_id UUID REFERENCES public.offers(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(offer_id, category_id)
);

-- Create offer_collections junction table (for collection-specific offers)
CREATE TABLE IF NOT EXISTS public.offer_collections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  offer_id UUID REFERENCES public.offers(id) ON DELETE CASCADE,
  collection_id UUID REFERENCES public.collections(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(offer_id, collection_id)
);

-- ==========================================
-- Indexes for Performance
-- ==========================================

-- Collections indexes
CREATE INDEX IF NOT EXISTS idx_collections_slug ON public.collections(slug);
CREATE INDEX IF NOT EXISTS idx_collections_type ON public.collections(type);
CREATE INDEX IF NOT EXISTS idx_collections_status ON public.collections(status);
CREATE INDEX IF NOT EXISTS idx_collections_featured ON public.collections(featured);
CREATE INDEX IF NOT EXISTS idx_collections_sort_order ON public.collections(sort_order);
CREATE INDEX IF NOT EXISTS idx_collections_created_at ON public.collections(created_at);

-- Collection products indexes
CREATE INDEX IF NOT EXISTS idx_collection_products_collection_id ON public.collection_products(collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_products_product_id ON public.collection_products(product_id);
CREATE INDEX IF NOT EXISTS idx_collection_products_sort_order ON public.collection_products(sort_order);

-- New arrivals indexes
CREATE INDEX IF NOT EXISTS idx_new_arrivals_product_id ON public.new_arrivals(product_id);
CREATE INDEX IF NOT EXISTS idx_new_arrivals_featured_until ON public.new_arrivals(featured_until);
CREATE INDEX IF NOT EXISTS idx_new_arrivals_is_active ON public.new_arrivals(is_active);
CREATE INDEX IF NOT EXISTS idx_new_arrivals_sort_order ON public.new_arrivals(sort_order);
CREATE INDEX IF NOT EXISTS idx_new_arrivals_created_at ON public.new_arrivals(created_at);

-- Offers indexes
CREATE INDEX IF NOT EXISTS idx_offers_offer_type ON public.offers(offer_type);
CREATE INDEX IF NOT EXISTS idx_offers_is_active ON public.offers(is_active);
CREATE INDEX IF NOT EXISTS idx_offers_is_featured ON public.offers(is_featured);
CREATE INDEX IF NOT EXISTS idx_offers_valid_from ON public.offers(valid_from);
CREATE INDEX IF NOT EXISTS idx_offers_valid_until ON public.offers(valid_until);
CREATE INDEX IF NOT EXISTS idx_offers_sort_order ON public.offers(sort_order);
CREATE INDEX IF NOT EXISTS idx_offers_created_at ON public.offers(created_at);

-- Offer junction table indexes
CREATE INDEX IF NOT EXISTS idx_offer_products_offer_id ON public.offer_products(offer_id);
CREATE INDEX IF NOT EXISTS idx_offer_products_product_id ON public.offer_products(product_id);
CREATE INDEX IF NOT EXISTS idx_offer_categories_offer_id ON public.offer_categories(offer_id);
CREATE INDEX IF NOT EXISTS idx_offer_categories_category_id ON public.offer_categories(category_id);
CREATE INDEX IF NOT EXISTS idx_offer_collections_offer_id ON public.offer_collections(offer_id);
CREATE INDEX IF NOT EXISTS idx_offer_collections_collection_id ON public.offer_collections(collection_id);

-- ==========================================
-- Row Level Security (RLS) Policies
-- ==========================================

-- Enable RLS on all new tables
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.new_arrivals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offer_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offer_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offer_collections ENABLE ROW LEVEL SECURITY;

-- Collections policies
CREATE POLICY "Collections are viewable by everyone" ON public.collections
  FOR SELECT USING (status = 'active' OR status = 'coming_soon');

CREATE POLICY "Collections are manageable by admins" ON public.collections
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Collection products policies
CREATE POLICY "Collection products are viewable by everyone" ON public.collection_products
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.collections c 
      WHERE c.id = collection_id AND (c.status = 'active' OR c.status = 'coming_soon')
    )
  );

CREATE POLICY "Collection products are manageable by admins" ON public.collection_products
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- New arrivals policies
CREATE POLICY "New arrivals are viewable by everyone" ON public.new_arrivals
  FOR SELECT USING (is_active = true);

CREATE POLICY "New arrivals are manageable by admins" ON public.new_arrivals
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Offers policies
CREATE POLICY "Active offers are viewable by everyone" ON public.offers
  FOR SELECT USING (is_active = true AND valid_from <= NOW() AND (valid_until IS NULL OR valid_until >= NOW()));

CREATE POLICY "Offers are manageable by admins" ON public.offers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Offer junction tables policies
CREATE POLICY "Offer products are viewable by everyone" ON public.offer_products
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.offers o 
      WHERE o.id = offer_id AND o.is_active = true AND o.valid_from <= NOW() AND (o.valid_until IS NULL OR o.valid_until >= NOW())
    )
  );

CREATE POLICY "Offer products are manageable by admins" ON public.offer_products
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Offer categories are viewable by everyone" ON public.offer_categories
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.offers o 
      WHERE o.id = offer_id AND o.is_active = true AND o.valid_from <= NOW() AND (o.valid_until IS NULL OR o.valid_until >= NOW())
    )
  );

CREATE POLICY "Offer categories are manageable by admins" ON public.offer_categories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Offer collections are viewable by everyone" ON public.offer_collections
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.offers o 
      WHERE o.id = offer_id AND o.is_active = true AND o.valid_from <= NOW() AND (o.valid_until IS NULL OR o.valid_until >= NOW())
    )
  );

CREATE POLICY "Offer collections are manageable by admins" ON public.offer_collections
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ==========================================
-- Helper Functions and Views
-- ==========================================

-- Function to get collection with product count
CREATE OR REPLACE FUNCTION public.get_collection_with_product_count(collection_id UUID)
RETURNS TABLE(
  id UUID,
  name TEXT,
  slug TEXT,
  description TEXT,
  short_description TEXT,
  image_url TEXT,
  banner_image_url TEXT,
  type TEXT,
  status TEXT,
  price DECIMAL(10, 2),
  original_price DECIMAL(10, 2),
  discount_percentage INTEGER,
  featured BOOLEAN,
  is_exclusive BOOLEAN,
  launch_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  sort_order INTEGER,
  tags TEXT[],
  meta_title TEXT,
  meta_description TEXT,
  product_count BIGINT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.name,
    c.slug,
    c.description,
    c.short_description,
    c.image_url,
    c.banner_image_url,
    c.type,
    c.status,
    c.price,
    c.original_price,
    c.discount_percentage,
    c.featured,
    c.is_exclusive,
    c.launch_date,
    c.end_date,
    c.sort_order,
    c.tags,
    c.meta_title,
    c.meta_description,
    COUNT(cp.product_id) as product_count,
    c.created_at,
    c.updated_at
  FROM public.collections c
  LEFT JOIN public.collection_products cp ON c.id = cp.collection_id
  WHERE c.id = collection_id
  GROUP BY c.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get active new arrivals with product details
CREATE OR REPLACE FUNCTION public.get_active_new_arrivals(limit_count INTEGER DEFAULT 10)
RETURNS TABLE(
  id UUID,
  product_id UUID,
  product_name TEXT,
  product_slug TEXT,
  product_price DECIMAL(10, 2),
  product_original_price DECIMAL(10, 2),
  product_images TEXT[],
  product_rating DECIMAL(3, 2),
  featured_until TIMESTAMP WITH TIME ZONE,
  sort_order INTEGER,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    na.id,
    na.product_id,
    p.name as product_name,
    p.slug as product_slug,
    p.price as product_price,
    p.original_price as product_original_price,
    p.images as product_images,
    p.rating as product_rating,
    na.featured_until,
    na.sort_order,
    na.created_at
  FROM public.new_arrivals na
  JOIN public.products p ON na.product_id = p.id
  WHERE na.is_active = true
    AND p.is_active = true
    AND (na.featured_until IS NULL OR na.featured_until > NOW())
  ORDER BY na.sort_order ASC, na.created_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get active offers with applicable products
CREATE OR REPLACE FUNCTION public.get_active_offers(limit_count INTEGER DEFAULT 10)
RETURNS TABLE(
  id UUID,
  title TEXT,
  description TEXT,
  short_description TEXT,
  offer_type TEXT,
  discount_value DECIMAL(10, 2),
  minimum_order_amount DECIMAL(10, 2),
  maximum_discount_amount DECIMAL(10, 2),
  image_url TEXT,
  banner_image_url TEXT,
  is_featured BOOLEAN,
  usage_limit INTEGER,
  usage_count INTEGER,
  user_usage_limit INTEGER,
  valid_from TIMESTAMP WITH TIME ZONE,
  valid_until TIMESTAMP WITH TIME ZONE,
  applicable_to TEXT,
  sort_order INTEGER,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    o.id,
    o.title,
    o.description,
    o.short_description,
    o.offer_type,
    o.discount_value,
    o.minimum_order_amount,
    o.maximum_discount_amount,
    o.image_url,
    o.banner_image_url,
    o.is_featured,
    o.usage_limit,
    o.usage_count,
    o.user_usage_limit,
    o.valid_from,
    o.valid_until,
    o.applicable_to,
    o.sort_order,
    o.created_at
  FROM public.offers o
  WHERE o.is_active = true
    AND o.valid_from <= NOW()
    AND (o.valid_until IS NULL OR o.valid_until >= NOW())
  ORDER BY o.sort_order ASC, o.created_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions on functions
GRANT EXECUTE ON FUNCTION public.get_collection_with_product_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_active_new_arrivals(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_active_offers(INTEGER) TO authenticated;

-- ==========================================
-- Sample Data
-- ==========================================

-- Insert sample collections
INSERT INTO public.collections (name, slug, description, short_description, image_url, banner_image_url, type, status, featured, is_exclusive, sort_order, tags) VALUES
('Royal Heritage Collection', 'royal-heritage', 'Timeless fragrances inspired by royal traditions and ancient perfumery arts.', 'Royal-inspired luxury attars', 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=400', 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=800', 'heritage', 'active', true, true, 1, ARRAY['royal', 'heritage', 'luxury']),
('Seasonal Blossoms', 'seasonal-blossoms', 'Fresh floral compositions that capture the essence of each season.', 'Seasonal floral fragrances', 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400', 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800', 'seasonal', 'active', true, false, 2, ARRAY['floral', 'seasonal', 'fresh']),
('Limited Edition Oud', 'limited-oud', 'Rare and precious oud compositions available for a limited time only.', 'Exclusive limited oud collection', 'https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=400', 'https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=800', 'limited', 'coming_soon', true, true, 3, ARRAY['oud', 'limited', 'premium'])
ON CONFLICT (slug) DO NOTHING;

-- Insert sample offers
INSERT INTO public.offers (title, description, short_description, offer_type, discount_value, image_url, is_active, is_featured, valid_from, valid_until, applicable_to, sort_order) VALUES
('Welcome Offer - 20% Off', 'Get 20% off on your first purchase of premium attars', 'First-time buyer discount', 'percentage', 20.00, 'https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=400', true, true, NOW(), NOW() + INTERVAL '30 days', 'all_products', 1),
('Free Shipping Weekend', 'Free shipping on all orders this weekend only', 'Weekend free shipping', 'free_shipping', 0.00, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400', true, true, NOW(), NOW() + INTERVAL '3 days', 'all_products', 2),
('Buy 2 Get 1 Free', 'Purchase any two attars and get the third one absolutely free', 'BOGO offer on attars', 'buy_one_get_one', 100.00, 'https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=400', true, false, NOW(), NOW() + INTERVAL '7 days', 'all_products', 3)
ON CONFLICT DO NOTHING;
