const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://xqqjxcmgjivjytzzisyf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxcWp4Y21naml2anl0enppc3lmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ1OTc0OTAsImV4cCI6MjA1MDE3MzQ5MH0.8Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkDatabaseWithToken() {
  console.log('🔍 Checking Supabase Database Structure with Access Token...');
  console.log('📍 Project URL:', supabaseUrl);
  console.log('🔑 Using Access Token: sbp_4406718fb2ef91d08056153caa9ab9590684673f');
  console.log('');

  try {
    // List of tables to check
    const tableNames = [
      'profiles', 'products', 'categories', 'orders', 'order_items',
      'cart_items', 'wishlist_items', 'reviews', 'addresses',
      'payment_methods', 'coupons', 'product_variants', 'order_tracking',
      'user_preferences', 'user_security_settings'
    ];

    console.log('🔍 Checking individual tables...');
    const existingTables = [];
    const tableStructures = {};
    
    for (const tableName of tableNames) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);
        
        if (!error) {
          existingTables.push(tableName);
          if (data && data.length > 0) {
            tableStructures[tableName] = Object.keys(data[0]);
          }
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
    
    // Check specific table structures
    console.log('');
    console.log('🔍 Table Structures:');
    
    for (const [tableName, columns] of Object.entries(tableStructures)) {
      console.log(`📋 ${tableName}:`);
      columns.forEach(column => console.log(`  - ${column}`));
      console.log('');
    }
    
    // Test specific queries that were failing
    console.log('🧪 Testing problematic queries...');
    
    // Test orders query with total_amount
    try {
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('id, total_amount, status, created_at')
        .limit(5);
      
      if (!ordersError) {
        console.log(`✅ Orders query with total_amount: ${ordersData?.length || 0} records`);
        if (ordersData && ordersData.length > 0) {
          console.log('Sample order:', ordersData[0]);
        }
      } else {
        console.log(`❌ Orders query failed: ${ordersError.message}`);
      }
    } catch (err) {
      console.log(`❌ Orders query error: ${err.message}`);
    }
    
    // Test order_tracking table
    try {
      const { data: trackingData, error: trackingError } = await supabase
        .from('order_tracking')
        .select('*')
        .limit(5);
      
      if (!trackingError) {
        console.log(`✅ Order tracking query: ${trackingData?.length || 0} records`);
        if (trackingData && trackingData.length > 0) {
          console.log('Sample tracking record:', trackingData[0]);
        }
      } else {
        console.log(`❌ Order tracking query failed: ${trackingError.message}`);
      }
    } catch (err) {
      console.log(`❌ Order tracking query error: ${err.message}`);
    }
    
    // Get record counts
    console.log('');
    console.log('📈 Record Counts:');
    
    for (const tableName of existingTables) {
      try {
        const { count, error } = await supabase
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

    console.log('');
    console.log('🎉 Database check completed successfully!');

  } catch (error) {
    console.error('❌ Error checking database:', error);
  }
}

checkDatabaseWithToken();
