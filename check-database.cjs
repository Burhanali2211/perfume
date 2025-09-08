const { createClient } = require('@supabase/supabase-js');

// Supabase configuration from your project
const supabaseUrl = 'https://xqqjxcmgjivjytzzisyf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxcWp4Y21naml2anl0enppc3lmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ1OTc0OTAsImV4cCI6MjA1MDE3MzQ5MH0.8Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkDatabase() {
  console.log('🔍 Checking Supabase Database Structure...');
  console.log('📍 Project URL:', supabaseUrl);
  console.log('');

  try {
    // Get list of tables using information_schema
    console.log('📋 Fetching table list...');
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_table_list')
      .catch(async () => {
        // Fallback: try to query information_schema directly
        const { data, error } = await supabase
          .from('information_schema.tables')
          .select('table_name')
          .eq('table_schema', 'public')
          .order('table_name');
        return { data, error };
      });

    if (tablesError) {
      console.log('⚠️ Could not get table list via RPC, trying direct queries...');
      
      // Try to query each table individually to see what exists
      const tableNames = [
        'profiles', 'products', 'categories', 'orders', 'order_items',
        'cart_items', 'wishlist_items', 'reviews', 'addresses',
        'payment_methods', 'coupons', 'product_variants', 'order_tracking',
        'user_preferences', 'user_security_settings'
      ];

      console.log('🔍 Checking individual tables...');
      const existingTables = [];
      
      for (const tableName of tableNames) {
        try {
          const { data, error } = await supabase
            .from(tableName)
            .select('count')
            .limit(1);
          
          if (!error) {
            existingTables.push(tableName);
            console.log(`✅ ${tableName} - exists`);
          } else {
            console.log(`❌ ${tableName} - ${error.message}`);
          }
        } catch (err) {
          console.log(`❌ ${tableName} - ${err.message}`);
        }
      }
      
      console.log('');
      console.log('📊 Summary:');
      console.log(`Found ${existingTables.length} tables:`);
      existingTables.forEach(table => console.log(`  - ${table}`));
      
      // Check specific table structures
      console.log('');
      console.log('🔍 Checking table structures...');
      
      // Check orders table structure
      try {
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select('*')
          .limit(1);
        
        if (!ordersError && ordersData && ordersData.length > 0) {
          console.log('📋 Orders table columns:', Object.keys(ordersData[0]));
        } else {
          console.log('📋 Orders table structure could not be determined');
        }
      } catch (err) {
        console.log('❌ Could not check orders table structure');
      }
      
      // Check profiles table structure
      try {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .limit(1);
        
        if (!profilesError && profilesData && profilesData.length > 0) {
          console.log('📋 Profiles table columns:', Object.keys(profilesData[0]));
        } else {
          console.log('📋 Profiles table structure could not be determined');
        }
      } catch (err) {
        console.log('❌ Could not check profiles table structure');
      }
      
    } else {
      console.log('✅ Tables found:', tables);
    }

    // Test basic queries
    console.log('');
    console.log('🧪 Testing basic queries...');
    
    // Test profiles query
    try {
      const { data: profilesCount, error: profilesError } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true });
      
      if (!profilesError) {
        console.log(`✅ Profiles: ${profilesCount || 0} records`);
      } else {
        console.log(`❌ Profiles query failed: ${profilesError.message}`);
      }
    } catch (err) {
      console.log(`❌ Profiles query error: ${err.message}`);
    }
    
    // Test orders query
    try {
      const { data: ordersCount, error: ordersError } = await supabase
        .from('orders')
        .select('id', { count: 'exact', head: true });
      
      if (!ordersError) {
        console.log(`✅ Orders: ${ordersCount || 0} records`);
      } else {
        console.log(`❌ Orders query failed: ${ordersError.message}`);
      }
    } catch (err) {
      console.log(`❌ Orders query error: ${err.message}`);
    }
    
    // Test products query
    try {
      const { data: productsCount, error: productsError } = await supabase
        .from('products')
        .select('id', { count: 'exact', head: true });
      
      if (!productsError) {
        console.log(`✅ Products: ${productsCount || 0} records`);
      } else {
        console.log(`❌ Products query failed: ${productsError.message}`);
      }
    } catch (err) {
      console.log(`❌ Products query error: ${err.message}`);
    }

    console.log('');
    console.log('🎉 Database check completed!');

  } catch (error) {
    console.error('❌ Error checking database:', error);
  }
}

checkDatabase();
