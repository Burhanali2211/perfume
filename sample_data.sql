-- =====================================================
-- SAMPLE DATA FOR E-COMMERCE DATABASE
-- Run this after creating the schema with complete_ecommerce_schema.sql
-- =====================================================

-- Insert Categories
INSERT INTO categories (name, slug, description, image_url, sort_order, created_at, updated_at)
VALUES
  ('Electronics', 'electronics', 'Latest gadgets and electronic devices', 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=500', 1, NOW(), NOW()),
  ('Clothing', 'clothing', 'Fashion and apparel for all occasions', 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=500', 2, NOW(), NOW()),
  ('Home & Garden', 'home-garden', 'Everything for your home and garden', 'https://images.unsplash.com/photo-1501127122-f385ca6ddd9d?w=500', 3, NOW(), NOW()),
  ('Sports & Outdoors', 'sports', 'Sports equipment and outdoor gear', 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=500', 4, NOW(), NOW()),
  ('Beauty & Personal Care', 'beauty', 'Beauty products and personal care items', 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500', 5, NOW(), NOW()),
  ('Books & Media', 'books', 'Books, music, and entertainment media', 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=500', 6, NOW(), NOW()),
  ('Automotive', 'automotive', 'Car accessories and automotive parts', 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=500', 7, NOW(), NOW()),
  ('Health & Wellness', 'health', 'Health supplements and wellness products', 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=500', 8, NOW(), NOW());

-- Insert Electronics Products
INSERT INTO products (name, slug, description, short_description, price, original_price, category_id, stock, sku, is_featured, is_active, images, tags, specs, created_at, updated_at)
VALUES
  ('Premium Wireless Headphones', 'premium-wireless-headphones', 'High-quality wireless headphones with active noise cancellation, premium sound quality, and 30-hour battery life. Perfect for music lovers and professionals.', 'Premium wireless headphones with noise cancellation', 199.99, 249.99, 
   (SELECT id FROM categories WHERE slug = 'electronics'), 45, 'SKU-WH-001', true, true, 
   ARRAY['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500', 'https://images.unsplash.com/photo-1572536147248-ac59a8abfa4b?w=500'],
   ARRAY['trending', 'bestseller', 'wireless'], 
   '{"Brand": "SoundMaster", "Battery Life": "30 hours", "Connectivity": "Bluetooth 5.0", "Noise Cancellation": "Active", "Weight": "250g"}',
   NOW(), NOW()),
   
  ('Smart Watch Series 5', 'smart-watch-series-5', 'Advanced smartwatch with comprehensive health monitoring, GPS tracking, water resistance up to 50m, and 48-hour battery life.', 'Advanced smartwatch with health monitoring', 299.99, 349.99, 
   (SELECT id FROM categories WHERE slug = 'electronics'), 30, 'SKU-SW-002', true, true, 
   ARRAY['https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=500', 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=500'],
   ARRAY['new', 'trending', 'fitness'], 
   '{"Brand": "TechFit", "Battery Life": "48 hours", "Water Resistance": "50m", "Display": "AMOLED", "GPS": "Built-in"}',
   NOW(), NOW()),
   
  ('Ultra HD Smart TV 55"', 'ultra-hd-smart-tv-55', 'Crystal clear 4K Ultra HD Smart TV with voice control, streaming apps, HDR support, and premium picture quality.', '55-inch 4K Ultra HD Smart TV', 699.99, 799.99, 
   (SELECT id FROM categories WHERE slug = 'electronics'), 15, 'SKU-TV-003', false, true, 
   ARRAY['https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=500', 'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=500'],
   ARRAY['bestseller', 'smart-tv'], 
   '{"Brand": "VisionPlus", "Resolution": "4K Ultra HD", "Smart Features": "Voice Control", "HDR": "HDR10+", "Size": "55 inches"}',
   NOW(), NOW()),
   
  ('Gaming Mechanical Keyboard', 'gaming-mechanical-keyboard', 'RGB backlit mechanical keyboard with tactile blue switches, full-size layout, and customizable lighting effects for gaming enthusiasts.', 'RGB mechanical keyboard for gaming', 129.99, 149.99, 
   (SELECT id FROM categories WHERE slug = 'electronics'), 35, 'SKU-KB-012', false, true, 
   ARRAY['https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=500', 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500'],
   ARRAY['gaming', 'trending', 'rgb'], 
   '{"Switch Type": "Mechanical Blue", "Backlight": "RGB", "Layout": "Full Size", "Connectivity": "USB-C", "Programmable": "Yes"}',
   NOW(), NOW()),
   
  ('Wireless Mouse Pro', 'wireless-mouse-pro', 'Precision wireless mouse with ergonomic design, 3200 DPI sensor, rechargeable battery, and long-lasting performance.', 'Precision wireless mouse with ergonomic design', 59.99, 69.99, 
   (SELECT id FROM categories WHERE slug = 'electronics'), 60, 'SKU-MS-013', false, true, 
   ARRAY['https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500', 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=500'],
   ARRAY['bestseller', 'wireless'], 
   '{"DPI": "3200", "Battery": "Rechargeable", "Connectivity": "2.4GHz Wireless", "Ergonomic": "Yes", "Buttons": "6"}',
   NOW(), NOW()),
   
  ('Portable Bluetooth Speaker', 'portable-bluetooth-speaker', 'Waterproof portable speaker with 360-degree sound, deep bass, 12-hour battery life, and IPX7 water resistance.', 'Waterproof portable speaker with 360-degree sound', 89.99, 109.99, 
   (SELECT id FROM categories WHERE slug = 'electronics'), 40, 'SKU-SP-014', true, true, 
   ARRAY['https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500', 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=500'],
   ARRAY['trending', 'new', 'waterproof'], 
   '{"Waterproof": "IPX7", "Battery Life": "12 hours", "Connectivity": "Bluetooth 5.0", "Sound": "360-degree", "Bass": "Enhanced"}',
   NOW(), NOW()),

  ('Smartphone Pro Max', 'smartphone-pro-max', 'Latest flagship smartphone with triple camera system, 5G connectivity, 256GB storage, and all-day battery life.', 'Flagship smartphone with triple camera system', 999.99, 1099.99, 
   (SELECT id FROM categories WHERE slug = 'electronics'), 25, 'SKU-SP-015', true, true, 
   ARRAY['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500', 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=500'],
   ARRAY['flagship', 'new', '5g'], 
   '{"Storage": "256GB", "Camera": "Triple 48MP", "5G": "Yes", "Battery": "4000mAh", "Display": "6.7 inch OLED"}',
   NOW(), NOW()),

  ('Laptop Ultrabook 14"', 'laptop-ultrabook-14', 'Lightweight ultrabook with Intel i7 processor, 16GB RAM, 512GB SSD, and 10-hour battery life for professionals.', 'Lightweight ultrabook for professionals', 1299.99, 1499.99, 
   (SELECT id FROM categories WHERE slug = 'electronics'), 20, 'SKU-LT-016', false, true, 
   ARRAY['https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500', 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=500'],
   ARRAY['professional', 'ultrabook'], 
   '{"Processor": "Intel i7", "RAM": "16GB", "Storage": "512GB SSD", "Display": "14 inch FHD", "Weight": "1.2kg"}',
   NOW(), NOW());

-- Insert Clothing Products
INSERT INTO products (name, slug, description, short_description, price, original_price, category_id, stock, sku, is_featured, is_active, images, tags, specs, created_at, updated_at)
VALUES
  ('Premium Cotton T-Shirt', 'premium-cotton-t-shirt', 'Soft, comfortable 100% cotton t-shirt with modern fit, pre-shrunk fabric, and available in multiple colors. Perfect for casual wear.', 'Soft, comfortable cotton t-shirt with modern fit', 29.99, 39.99, 
   (SELECT id FROM categories WHERE slug = 'clothing'), 100, 'SKU-TS-004', false, true, 
   ARRAY['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500', 'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=500'],
   ARRAY['bestseller', 'cotton', 'casual'], 
   '{"Material": "100% Cotton", "Fit": "Regular", "Care": "Machine Washable", "Sizes": "XS-XXL", "Colors": "Multiple"}',
   NOW(), NOW()),
   
  ('Designer Denim Jeans', 'designer-denim-jeans', 'Premium quality denim jeans with perfect fit, durability, and classic 5-pocket styling. Made from sustainable denim fabric.', 'Premium quality denim jeans with perfect fit', 89.99, 109.99, 
   (SELECT id FROM categories WHERE slug = 'clothing'), 75, 'SKU-DJ-005', true, true, 
   ARRAY['https://images.unsplash.com/photo-1542272604-787c3835535d?w=500', 'https://images.unsplash.com/photo-1582552938357-32b906df40cb?w=500'],
   ARRAY['trending', 'sale', 'denim'], 
   '{"Material": "Premium Denim", "Fit": "Slim", "Style": "Classic 5-pocket", "Sustainable": "Yes", "Stretch": "2% Elastane"}',
   NOW(), NOW()),
   
  ('Casual Hoodie', 'casual-hoodie', 'Comfortable cotton blend hoodie perfect for casual wear, featuring kangaroo pocket, adjustable hood, and soft fleece lining.', 'Comfortable cotton blend hoodie for casual wear', 49.99, 59.99, 
   (SELECT id FROM categories WHERE slug = 'clothing'), 80, 'SKU-HD-015', false, true, 
   ARRAY['https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500', 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=500'],
   ARRAY['casual', 'bestseller', 'hoodie'], 
   '{"Material": "Cotton Blend", "Fit": "Regular", "Features": "Kangaroo Pocket", "Lining": "Fleece", "Hood": "Adjustable"}',
   NOW(), NOW()),
   
  ('Summer Dress', 'summer-dress', 'Elegant floral summer dress with comfortable fit, breathable fabric, and midi length. Perfect for warm weather occasions.', 'Elegant floral summer dress with comfortable fit', 79.99, 99.99, 
   (SELECT id FROM categories WHERE slug = 'clothing'), 45, 'SKU-DR-016', true, true, 
   ARRAY['https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500', 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=500'],
   ARRAY['summer', 'trending', 'dress'], 
   '{"Material": "Chiffon", "Pattern": "Floral", "Length": "Midi", "Sleeves": "Short", "Occasion": "Casual/Semi-formal"}',
   NOW(), NOW()),
   
  ('Athletic Sneakers', 'athletic-sneakers', 'High-performance athletic sneakers with superior comfort, air sole cushioning, and mesh upper for breathability.', 'High-performance athletic sneakers with comfort', 119.99, 139.99, 
   (SELECT id FROM categories WHERE slug = 'clothing'), 55, 'SKU-SN-017', true, true, 
   ARRAY['https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500', 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=500'],
   ARRAY['athletic', 'bestseller', 'sneakers'], 
   '{"Type": "Running", "Cushioning": "Air Sole", "Material": "Mesh Upper", "Support": "Arch Support", "Sole": "Rubber"}',
   NOW(), NOW()),

  ('Business Suit', 'business-suit', 'Professional business suit with tailored fit, wrinkle-resistant fabric, and classic styling for formal occasions.', 'Professional business suit with tailored fit', 299.99, 399.99, 
   (SELECT id FROM categories WHERE slug = 'clothing'), 25, 'SKU-BS-018', false, true, 
   ARRAY['https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=500', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500'],
   ARRAY['formal', 'business', 'suit'], 
   '{"Material": "Wool Blend", "Fit": "Tailored", "Pieces": "2-piece", "Wrinkle-resistant": "Yes", "Occasion": "Business/Formal"}',
   NOW(), NOW()),

  ('Winter Jacket', 'winter-jacket', 'Warm winter jacket with down insulation, water-resistant exterior, and multiple pockets for cold weather protection.', 'Warm winter jacket with down insulation', 159.99, 199.99, 
   (SELECT id FROM categories WHERE slug = 'clothing'), 35, 'SKU-WJ-019', false, true, 
   ARRAY['https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?w=500', 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=500'],
   ARRAY['winter', 'jacket', 'warm'], 
   '{"Insulation": "Down", "Water-resistant": "Yes", "Pockets": "Multiple", "Hood": "Detachable", "Temperature": "-10°C to 5°C"}',
   NOW(), NOW()),

  ('Yoga Leggings', 'yoga-leggings', 'High-waisted yoga leggings with moisture-wicking fabric, four-way stretch, and squat-proof design for active wear.', 'High-waisted yoga leggings with moisture-wicking', 39.99, 49.99,
   (SELECT id FROM categories WHERE slug = 'clothing'), 70, 'SKU-YL-020', true, true,
   ARRAY['https://images.unsplash.com/photo-1506629905607-c52b1b8b3b8b?w=500', 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500'],
   ARRAY['yoga', 'activewear', 'leggings'],
   '{"Material": "Polyester Spandex", "Waist": "High-waisted", "Stretch": "Four-way", "Moisture-wicking": "Yes", "Squat-proof": "Yes"}',
   NOW(), NOW());

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

-- Add some product variants for clothing items
INSERT INTO product_variants (product_id, name, sku, price, original_price, stock, attributes, created_at, updated_at)
SELECT
  p.id,
  p.name || ' - ' || size.size || ' - ' || color.color,
  p.sku || '-' || size.code || '-' || color.code,
  p.price,
  p.original_price,
  FLOOR(RANDOM() * 20) + 5,
  json_build_object('size', size.size, 'color', color.color)::jsonb,
  NOW(),
  NOW()
FROM products p
CROSS JOIN (
  VALUES ('S', 'Small'), ('M', 'Medium'), ('L', 'Large'), ('XL', 'X-Large')
) AS size(code, size)
CROSS JOIN (
  VALUES ('BLK', 'Black'), ('WHT', 'White'), ('BLU', 'Blue'), ('RED', 'Red')
) AS color(code, color)
WHERE p.category_id = (SELECT id FROM categories WHERE slug = 'clothing')
AND p.name IN ('Premium Cotton T-Shirt', 'Casual Hoodie', 'Summer Dress')
LIMIT 48; -- 3 products × 4 sizes × 4 colors

-- Add some product variants for electronics (different storage/color options)
INSERT INTO product_variants (product_id, name, sku, price, original_price, stock, attributes, created_at, updated_at)
SELECT
  p.id,
  p.name || ' - ' || storage.storage || ' - ' || color.color,
  p.sku || '-' || storage.code || '-' || color.code,
  p.price + storage.price_add,
  p.original_price + storage.price_add,
  FLOOR(RANDOM() * 15) + 3,
  json_build_object('storage', storage.storage, 'color', color.color)::jsonb,
  NOW(),
  NOW()
FROM products p
CROSS JOIN (
  VALUES ('128', '128GB', 0), ('256', '256GB', 100), ('512', '512GB', 200)
) AS storage(code, storage, price_add)
CROSS JOIN (
  VALUES ('BLK', 'Black'), ('WHT', 'White'), ('BLU', 'Blue')
) AS color(code, color)
WHERE p.category_id = (SELECT id FROM categories WHERE slug = 'electronics')
AND p.name = 'Smartphone Pro Max'
LIMIT 9; -- 1 product × 3 storage × 3 colors

SELECT 'Sample data inserted successfully!' as message,
       (SELECT COUNT(*) FROM products) as total_products,
       (SELECT COUNT(*) FROM product_variants) as total_variants,
       (SELECT COUNT(*) FROM categories) as total_categories,
       (SELECT COUNT(*) FROM coupons) as total_coupons;
