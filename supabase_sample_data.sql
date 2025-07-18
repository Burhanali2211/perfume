-- =====================================================
-- SAMPLE DATA FOR E-COMMERCE PLATFORM
-- =====================================================
-- This script populates the database with realistic sample data
-- Run this AFTER the main schema script has been executed
-- =====================================================

-- Insert sample categories
INSERT INTO categories (name, slug, description, image_url, sort_order, is_active, meta_title, meta_description) VALUES
('Electronics', 'electronics', 'Latest electronic devices and gadgets', 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=500', 1, true, 'Electronics - Latest Gadgets', 'Shop the latest electronic devices and gadgets'),
('Clothing', 'clothing', 'Fashion and apparel for all occasions', 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=500', 2, true, 'Clothing - Fashion & Apparel', 'Discover the latest fashion trends and clothing'),
('Home & Garden', 'home-garden', 'Everything for your home and garden', 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500', 3, true, 'Home & Garden', 'Transform your home and garden with our products'),
('Sports & Outdoors', 'sports-outdoors', 'Sports equipment and outdoor gear', 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500', 4, true, 'Sports & Outdoors', 'Get active with our sports and outdoor equipment'),
('Books', 'books', 'Books for all ages and interests', 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=500', 5, true, 'Books', 'Discover your next great read'),
('Beauty & Health', 'beauty-health', 'Beauty products and health essentials', 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500', 6, true, 'Beauty & Health', 'Beauty products and health essentials for wellness');

-- Insert subcategories
INSERT INTO categories (name, slug, description, parent_id, sort_order, is_active) VALUES
('Smartphones', 'smartphones', 'Latest smartphones and mobile devices', (SELECT id FROM categories WHERE slug = 'electronics'), 1, true),
('Laptops', 'laptops', 'Laptops and portable computers', (SELECT id FROM categories WHERE slug = 'electronics'), 2, true),
('Headphones', 'headphones', 'Audio equipment and headphones', (SELECT id FROM categories WHERE slug = 'electronics'), 3, true),
('Men''s Clothing', 'mens-clothing', 'Fashion for men', (SELECT id FROM categories WHERE slug = 'clothing'), 1, true),
('Women''s Clothing', 'womens-clothing', 'Fashion for women', (SELECT id FROM categories WHERE slug = 'clothing'), 2, true),
('Furniture', 'furniture', 'Home furniture and decor', (SELECT id FROM categories WHERE slug = 'home-garden'), 1, true),
('Fitness Equipment', 'fitness-equipment', 'Exercise and fitness gear', (SELECT id FROM categories WHERE slug = 'sports-outdoors'), 1, true);

-- Insert sample products
INSERT INTO products (name, slug, description, short_description, price, original_price, category_id, stock, sku, is_featured, is_active, images, tags, specs, created_at, updated_at)
VALUES
-- Electronics Products
('Premium Wireless Headphones', 'premium-wireless-headphones', 'High-quality wireless headphones with active noise cancellation, premium sound quality, and 30-hour battery life. Perfect for music lovers and professionals.', 'Premium wireless headphones with noise cancellation', 199.99, 249.99, 
 (SELECT id FROM categories WHERE slug = 'headphones'), 45, 'SKU-WH-001', true, true, 
 ARRAY['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500', 'https://images.unsplash.com/photo-1572536147248-ac59a8abfa4b?w=500'],
 ARRAY['wireless', 'noise-cancelling', 'premium', 'audio'], 
 '{"battery_life": "30 hours", "connectivity": "Bluetooth 5.0", "noise_cancellation": "Active", "weight": "250g"}', NOW(), NOW()),

('Smartphone Pro Max', 'smartphone-pro-max', 'Latest flagship smartphone with advanced camera system, powerful processor, and all-day battery life. Features premium build quality and cutting-edge technology.', 'Latest flagship smartphone with advanced features', 999.99, 1099.99,
 (SELECT id FROM categories WHERE slug = 'smartphones'), 25, 'SKU-SP-001', true, true,
 ARRAY['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500', 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=500'],
 ARRAY['smartphone', 'flagship', 'camera', 'premium'],
 '{"screen_size": "6.7 inches", "storage": "256GB", "camera": "108MP", "battery": "4500mAh", "os": "Android 13"}', NOW(), NOW()),

('Gaming Laptop Pro', 'gaming-laptop-pro', 'High-performance gaming laptop with latest graphics card, fast processor, and premium display. Perfect for gaming and creative work.', 'High-performance gaming laptop', 1499.99, 1699.99,
 (SELECT id FROM categories WHERE slug = 'laptops'), 15, 'SKU-LP-001', true, true,
 ARRAY['https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=500', 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=500'],
 ARRAY['gaming', 'laptop', 'high-performance', 'graphics'],
 '{"processor": "Intel i7", "graphics": "RTX 4060", "ram": "16GB", "storage": "1TB SSD", "display": "15.6 inch 144Hz"}', NOW(), NOW()),

-- Clothing Products
('Classic Denim Jacket', 'classic-denim-jacket', 'Timeless denim jacket made from premium cotton. Perfect for casual wear and layering. Available in multiple washes and sizes.', 'Timeless denim jacket in premium cotton', 89.99, 119.99,
 (SELECT id FROM categories WHERE slug = 'mens-clothing'), 60, 'SKU-DJ-001', false, true,
 ARRAY['https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500', 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=500'],
 ARRAY['denim', 'jacket', 'casual', 'cotton'],
 '{"material": "100% Cotton", "fit": "Regular", "care": "Machine wash", "origin": "USA"}', NOW(), NOW()),

('Elegant Evening Dress', 'elegant-evening-dress', 'Sophisticated evening dress perfect for special occasions. Features elegant design, premium fabric, and flattering silhouette.', 'Sophisticated evening dress for special occasions', 159.99, 199.99,
 (SELECT id FROM categories WHERE slug = 'womens-clothing'), 30, 'SKU-ED-001', true, true,
 ARRAY['https://images.unsplash.com/photo-1566479179817-c0b8b8b5b8b8?w=500', 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=500'],
 ARRAY['dress', 'evening', 'elegant', 'formal'],
 '{"material": "Silk blend", "length": "Midi", "care": "Dry clean only", "lining": "Fully lined"}', NOW(), NOW()),

-- Home & Garden Products
('Modern Coffee Table', 'modern-coffee-table', 'Sleek and modern coffee table with clean lines and premium materials. Perfect centerpiece for contemporary living rooms.', 'Sleek modern coffee table', 299.99, 399.99,
 (SELECT id FROM categories WHERE slug = 'furniture'), 20, 'SKU-CT-001', false, true,
 ARRAY['https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500', 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500'],
 ARRAY['furniture', 'coffee-table', 'modern', 'living-room'],
 '{"material": "Oak wood", "dimensions": "120x60x45cm", "weight": "25kg", "assembly": "Required"}', NOW(), NOW()),

-- Sports & Outdoors Products
('Professional Yoga Mat', 'professional-yoga-mat', 'High-quality yoga mat with superior grip and cushioning. Perfect for all types of yoga practice and exercise routines.', 'High-quality yoga mat with superior grip', 49.99, 69.99,
 (SELECT id FROM categories WHERE slug = 'fitness-equipment'), 100, 'SKU-YM-001', false, true,
 ARRAY['https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500', 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=500'],
 ARRAY['yoga', 'fitness', 'exercise', 'mat'],
 '{"thickness": "6mm", "material": "TPE", "dimensions": "183x61cm", "weight": "1.2kg", "eco_friendly": true}', NOW(), NOW()),

-- Books
('The Art of Programming', 'art-of-programming', 'Comprehensive guide to modern programming practices and principles. Essential reading for developers of all levels.', 'Comprehensive programming guide', 39.99, 49.99,
 (SELECT id FROM categories WHERE slug = 'books'), 75, 'SKU-BK-001', false, true,
 ARRAY['https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=500', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500'],
 ARRAY['programming', 'technology', 'education', 'development'],
 '{"pages": 450, "publisher": "Tech Press", "language": "English", "format": "Paperback", "isbn": "978-1234567890"}', NOW(), NOW()),

-- Beauty & Health
('Organic Face Serum', 'organic-face-serum', 'Premium organic face serum with natural ingredients. Helps reduce signs of aging and promotes healthy, glowing skin.', 'Premium organic anti-aging face serum', 79.99, 99.99,
 (SELECT id FROM categories WHERE slug = 'beauty-health'), 50, 'SKU-FS-001', true, true,
 ARRAY['https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500', 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=500'],
 ARRAY['skincare', 'organic', 'anti-aging', 'serum'],
 '{"volume": "30ml", "ingredients": "Organic", "skin_type": "All types", "cruelty_free": true, "vegan": true}', NOW(), NOW());

-- Insert product variants for smartphone
INSERT INTO product_variants (product_id, name, sku, price, stock, attributes, sort_order, is_active)
SELECT 
    p.id,
    p.name || ' - ' || storage.value || ' - ' || color.value,
    'SKU-SP-001-' || storage.code || '-' || color.code,
    p.price + storage.price_modifier,
    FLOOR(RANDOM() * 10) + 5,
    jsonb_build_object('storage', storage.value, 'color', color.value),
    (storage.sort_order * 10) + color.sort_order,
    true
FROM products p
CROSS JOIN (
    VALUES 
        ('128GB', '128gb', 0, 1),
        ('256GB', '256gb', 100, 2),
        ('512GB', '512gb', 200, 3)
) AS storage(value, code, price_modifier, sort_order)
CROSS JOIN (
    VALUES 
        ('Space Black', 'black', 1),
        ('Silver', 'silver', 2),
        ('Gold', 'gold', 3)
) AS color(value, code, sort_order)
WHERE p.slug = 'smartphone-pro-max';

-- Insert sample coupons
INSERT INTO coupons (code, name, description, type, value, minimum_amount, usage_limit, is_active, starts_at, expires_at, created_at, updated_at)
VALUES
('WELCOME10', 'Welcome Discount', 'Get 10% off your first order', 'percentage', 10.00, 50.00, 1000, true, NOW() - INTERVAL '1 day', NOW() + INTERVAL '30 days', NOW(), NOW()),
('SAVE20', 'Save $20', 'Save $20 on orders over $100', 'fixed_amount', 20.00, 100.00, 500, true, NOW() - INTERVAL '1 day', NOW() + INTERVAL '15 days', NOW(), NOW()),
('FREESHIP', 'Free Shipping', 'Free shipping on any order', 'free_shipping', 0.00, 0.00, 2000, true, NOW() - INTERVAL '1 day', NOW() + INTERVAL '60 days', NOW(), NOW()),
('SUMMER25', 'Summer Sale', 'Get 25% off summer items', 'percentage', 25.00, 75.00, 300, true, NOW() - INTERVAL '5 days', NOW() + INTERVAL '10 days', NOW(), NOW()),
('NEWUSER15', 'New User Discount', '15% off for new customers', 'percentage', 15.00, 30.00, 1500, true, NOW() - INTERVAL '1 day', NOW() + INTERVAL '45 days', NOW(), NOW());

-- Update product ratings and review counts with realistic random values
UPDATE products SET
  rating = ROUND((4.0 + (RANDOM() * 1.0))::numeric, 1),
  review_count = FLOOR(RANDOM() * 25) + 1;

-- Set some featured products to have higher ratings
UPDATE products SET
  rating = ROUND((4.3 + (RANDOM() * 0.7))::numeric, 1),
  review_count = FLOOR(RANDOM() * 50) + 15
WHERE is_featured = true;

-- Display completion message
SELECT 'Sample data inserted successfully!' as message,
       (SELECT COUNT(*) FROM products) as total_products,
       (SELECT COUNT(*) FROM product_variants) as total_variants,
       (SELECT COUNT(*) FROM categories) as total_categories,
       (SELECT COUNT(*) FROM coupons) as total_coupons;
