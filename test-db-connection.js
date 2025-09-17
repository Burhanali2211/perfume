// Simple database connection test
import { supabase } from './src/lib/supabase.js';

async function testDatabaseConnection() {
  console.log('🔍 Testing Supabase Database Connection...');
  console.log('Database URL:', import.meta.env.VITE_SUPABASE_URL);
  
  try {
    // Test 1: Categories
    console.log('\n📂 Testing Categories...');
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('*')
      .limit(3);
    
    if (catError) {
      console.error('❌ Categories Error:', catError);
    } else {
      console.log('✅ Categories found:', categories.length);
      if (categories.length > 0) {
        console.log('Sample category:', {
          id: categories[0].id,
          name: categories[0].name,
          slug: categories[0].slug
        });
      }
    }
    
    // Test 2: Products
    console.log('\n🛍️ Testing Products...');
    const { data: products, error: prodError } = await supabase
      .from('products')
      .select('*')
      .limit(3);
    
    if (prodError) {
      console.error('❌ Products Error:', prodError);
    } else {
      console.log('✅ Products found:', products.length);
      if (products.length > 0) {
        console.log('Sample product:', {
          id: products[0].id,
          name: products[0].name,
          price: products[0].price,
          image_url: products[0].image_url
        });
      }
    }
    
    // Test 3: Test our mapped functions
    console.log('\n🔄 Testing Mapped Functions...');
    
    // Import our functions
    const { getCategories, getFeaturedProducts } = await import('./src/lib/supabase.js');
    
    const mappedCategories = await getCategories();
    console.log('✅ Mapped Categories:', mappedCategories.length);
    
    const mappedProducts = await getFeaturedProducts();
    console.log('✅ Mapped Featured Products:', mappedProducts.length);
    
    if (mappedProducts.length > 0) {
      console.log('Sample mapped product:', {
        id: mappedProducts[0].id,
        name: mappedProducts[0].name,
        price: mappedProducts[0].price,
        images: mappedProducts[0].images,
        reviewCount: mappedProducts[0].reviewCount
      });
    }
    
    console.log('\n🎉 Database connection test completed successfully!');
    
  } catch (error) {
    console.error('💥 Database connection test failed:', error);
  }
}

// Run the test
testDatabaseConnection();
