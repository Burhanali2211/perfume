const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function testConnection() {
  console.log('🧪 Testing Supabase Connection...');
  console.log('');

  // Get configuration from environment variables
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.log('❌ Missing environment variables!');
    console.log('');
    console.log('Please create a .env file with:');
    console.log('VITE_SUPABASE_URL=https://your-project.supabase.co');
    console.log('VITE_SUPABASE_ANON_KEY=your-anon-key-here');
    console.log('');
    console.log('Then run: npm install dotenv');
    return;
  }

  console.log('📍 Supabase URL:', supabaseUrl);
  console.log('🔑 Anon Key:', supabaseAnonKey.substring(0, 20) + '...');
  console.log('');

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Test basic connection
    console.log('1. Testing basic connection...');
    const { data: testData, error: testError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.log('❌ Connection failed:', testError.message);
      return;
    }
    console.log('✅ Connection successful!');

    // Test table access
    console.log('');
    console.log('2. Testing table access...');
    
    const tables = [
      'profiles', 'products', 'categories', 'orders', 'order_items',
      'cart_items', 'wishlist_items', 'reviews', 'addresses',
      'payment_methods', 'coupons', 'product_variants', 'order_tracking',
      'user_preferences', 'user_security_settings'
    ];

    const accessibleTables = [];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('count')
          .limit(1);
        
        if (!error) {
          accessibleTables.push(table);
          console.log(`✅ ${table} - accessible`);
        } else {
          console.log(`❌ ${table} - ${error.message}`);
        }
      } catch (err) {
        console.log(`❌ ${table} - ${err.message}`);
      }
    }

    console.log('');
    console.log(`📊 Summary: ${accessibleTables.length}/${tables.length} tables accessible`);

    // Test specific queries
    console.log('');
    console.log('3. Testing specific queries...');
    
    // Test orders query
    try {
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('id, total_amount, status, created_at')
        .limit(1);
      
      if (!ordersError) {
        console.log('✅ Orders query with total_amount works');
      } else {
        console.log('❌ Orders query failed:', ordersError.message);
      }
    } catch (err) {
      console.log('❌ Orders query error:', err.message);
    }

    // Test order_tracking query
    try {
      const { data: trackingData, error: trackingError } = await supabase
        .from('order_tracking')
        .select('*')
        .limit(1);
      
      if (!trackingError) {
        console.log('✅ Order tracking query works');
      } else {
        console.log('❌ Order tracking query failed:', trackingError.message);
      }
    } catch (err) {
      console.log('❌ Order tracking query error:', err.message);
    }

    // Get record counts
    console.log('');
    console.log('4. Getting record counts...');
    
    for (const table of accessibleTables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        if (!error) {
          console.log(`  ${table}: ${count || 0} records`);
        }
      } catch (err) {
        console.log(`  ${table}: Error getting count`);
      }
    }

    console.log('');
    if (accessibleTables.length >= 10) {
      console.log('🎉 Database is ready! You can now:');
      console.log('1. Start your development server: npm run dev');
      console.log('2. Test the admin dashboard');
      console.log('3. Perform CRUD operations');
    } else {
      console.log('⚠️ Some tables are missing. Run the database setup:');
      console.log('node setup-database.cjs');
    }

  } catch (error) {
    console.error('❌ Error testing connection:', error);
  }
}

testConnection();
