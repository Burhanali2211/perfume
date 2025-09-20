-- ==========================================
-- 09-reviews.sql
-- Product reviews functionality
-- ==========================================

-- Create reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  comment TEXT,
  images TEXT[],
  is_verified_purchase BOOLEAN DEFAULT false,
  is_approved BOOLEAN DEFAULT true,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for reviews
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON public.reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON public.reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_is_approved ON public.reviews(is_approved);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON public.reviews(created_at);

-- Ensure unique constraint for user-product combinations
CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_user_product ON public.reviews(user_id, product_id);

-- Enable RLS on reviews
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Create policies for reviews
CREATE POLICY "Approved reviews are viewable by everyone" ON public.reviews
  FOR SELECT USING (is_approved = true);

CREATE POLICY "Users can insert their own reviews" ON public.reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews" ON public.reviews
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews" ON public.reviews
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all reviews" ON public.reviews
  FOR ALL USING (public.is_admin(auth.uid()));

-- Grant permissions
GRANT SELECT ON public.reviews TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;

-- Create trigger for reviews updated_at
DROP TRIGGER IF EXISTS update_reviews_updated_at ON public.reviews;
CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ==========================================
-- Review Helper Functions
-- ==========================================

-- Function to increment helpful count
CREATE OR REPLACE FUNCTION public.increment_review_helpful(review_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.reviews 
  SET helpful_count = helpful_count + 1 
  WHERE id = review_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has purchased product
CREATE OR REPLACE FUNCTION public.has_user_purchased_product(p_user_id UUID, p_product_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.order_items oi
    JOIN public.orders o ON oi.order_id = o.id
    WHERE o.user_id = p_user_id 
      AND oi.product_id = p_product_id
      AND o.status IN ('delivered', 'completed')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function to set verified purchase status
CREATE OR REPLACE FUNCTION public.set_verified_purchase_status()
RETURNS TRIGGER AS $$
BEGIN
  NEW.is_verified_purchase := public.has_user_purchased_product(NEW.user_id, NEW.product_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for verified purchase status
DROP TRIGGER IF EXISTS set_verified_purchase_status_trigger ON public.reviews;
CREATE TRIGGER set_verified_purchase_status_trigger
  BEFORE INSERT ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.set_verified_purchase_status();

-- ==========================================
-- Review Statistics Views
-- ==========================================

-- Create a view for product review statistics
CREATE OR REPLACE VIEW public.product_review_stats AS
SELECT 
  product_id,
  COUNT(*) as review_count,
  AVG(rating) as average_rating,
  SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as five_star_count,
  SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as four_star_count,
  SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as three_star_count,
  SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as two_star_count,
  SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as one_star_count
FROM public.reviews
WHERE is_approved = true
GROUP BY product_id;

-- Grant permissions on the view
GRANT SELECT ON public.product_review_stats TO anon, authenticated;

-- Create a view for review details with user info
CREATE OR REPLACE VIEW public.review_details AS
SELECT 
  r.id,
  r.product_id,
  r.user_id,
  r.rating,
  r.title,
  r.comment,
  r.images,
  r.is_verified_purchase,
  r.helpful_count,
  r.created_at,
  p.full_name as reviewer_name,
  p.avatar_url as reviewer_avatar
FROM public.reviews r
JOIN public.profiles p ON r.user_id = p.id
WHERE r.is_approved = true;

-- Grant permissions on the view
GRANT SELECT ON public.review_details TO anon, authenticated;