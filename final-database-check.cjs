const { createClient } = require('@supabase/supabase-js');

// Try with the correct project URL from the API response
const supabaseUrl = 'https://bxyzvaujvhumupwdmysh.supabase.co'; // This might be the correct URL
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxcWp4Y21naml2anl0enppc3lmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ1OTc0OTAsImV4cCI6MjA1MDE3MzQ5MH0.8Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function finalDatabaseCheck() {
  console.log('🔍 Final Database Check with Correct Project URL...');
  console.log('📍 Project URL:', supabaseUrl);
  console.log('');

  try {
    // Test basic connection
    console.log('1. Testing basic connection...');
    const { data: testData, error: testError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.log('❌ Connection failed:', testError.message);
      
      // Try the original URL
      console.log('');
      console.log('2. Trying original project URL...');
      const originalUrl = 'https://xqqjxcmgjivjytzzisyf.supabase.co';
      const originalSupabase = createClient(originalUrl, supabaseAnonKey);
      
      const { data: originalTestData, error: originalTestError } = await originalSupabase
        .from('profiles')
        .select('count')
        .limit(1);
      
      if (originalTestError) {
        console.log('❌ Original URL also failed:', originalTestError.message);
        
        // Let's try to create a simple test to see what's available
        console.log('');
        console.log('3. Attempting to create a test table...');
        
        // Try to create a simple test table
        const { data: createData, error: createError } = await originalSupabase
          .from('test_table')
          .select('*')
          .limit(1);
        
        if (createError) {
          console.log('❌ Test table query failed:', createError.message);
        } else {
          console.log('✅ Test table accessible');
        }
        
      } else {
        console.log('✅ Original URL works!');
        console.log('Using original URL for further checks...');
        
        // Use the original URL for the rest of the checks
        const workingSupabase = originalSupabase;
        
        // Check tables
        console.log('');
        console.log('4. Checking available tables...');
        
        const tableNames = [
          'profiles', 'products', 'categories', 'orders', 'order_items',
          'cart_items', 'wishlist_items', 'reviews', 'addresses',
          'payment_methods', 'coupons', 'product_variants', 'order_tracking'
        ];
        
        const existingTables = [];
        
        for (const tableName of tableNames) {
          try {
            const { data, error } = await workingSupabase
              .from(tableName)
              .select('*')
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
        console.log('📊 Database Summary:');
        console.log(`Found ${existingTables.length} tables:`);
        existingTables.forEach(table => console.log(`  - ${table}`));
        
        // Get record counts
        console.log('');
        console.log('📈 Record Counts:');
        
        for (const tableName of existingTables) {
          try {
            const { count, error } = await workingSupabase
              .from(tableName)
              .select('*', { count: 'exact', head: true });
            
            if (!error) {
              console.log(`  ${tableName}: ${count || 0} records`);
            } else {
              console.log(`  ${tableName}: Error getting count - ${error.message}`);
            }
          } catch (err) {
            console.log(`  ${tableName}: Error - ${err.message}`);
          }
        }
        
        // Test the specific queries that were failing
        console.log('');
        console.log('🧪 Testing problematic queries...');
        
        // Test orders query
        try {
          const { data: ordersData, error: ordersError } = await workingSupabase
            .from('orders')
            .select('id, total_amount, status, created_at')
            .limit(5);
          
          if (!ordersError) {
            console.log(`✅ Orders query with total_amount: ${ordersData?.length || 0} records`);
            if (ordersData && ordersData.length > 0) {
              console.log('Sample order structure:', Object.keys(ordersData[0]));
            }
          } else {
            console.log(`❌ Orders query failed: ${ordersError.message}`);
          }
        } catch (err) {
          console.log(`❌ Orders query error: ${err.message}`);
        }
        
        // Test order_tracking table
        try {
          const { data: trackingData, error: trackingError } = await workingSupabase
            .from('order_tracking')
            .select('*')
            .limit(5);
          
          if (!trackingError) {
            console.log(`✅ Order tracking query: ${trackingData?.length || 0} records`);
            if (trackingData && trackingData.length > 0) {
              console.log('Sample tracking structure:', Object.keys(trackingData[0]));
            }
          } else {
            console.log(`❌ Order tracking query failed: ${trackingError.message}`);
          }
        } catch (err) {
          console.log(`❌ Order tracking query error: ${err.message}`);
        }
      }
    } else {
      console.log('✅ Connection successful with new URL');
    }

  } catch (error) {
    console.error('❌ Error during final database check:', error);
  }
}

finalDatabaseCheck();
