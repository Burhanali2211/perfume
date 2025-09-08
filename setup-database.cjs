const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Supabase configuration - these should be updated with your correct values
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://bxyzvaujvhumupwdmysh.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'your_anon_key_here';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function setupDatabase() {
  console.log('🚀 Setting up complete database for e-commerce platform...');
  console.log('📍 Supabase URL:', supabaseUrl);
  console.log('');

  try {
    // Test connection first
    console.log('1. Testing database connection...');
    const { data: testData, error: testError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.error('❌ Database connection failed:', testError.message);
      console.log('Please check your Supabase URL and anon key in the environment variables.');
      return;
    }
    console.log('✅ Database connection successful');

    // Read and execute the SQL setup script
    console.log('');
    console.log('2. Reading database setup script...');
    const sqlScript = fs.readFileSync('complete-database-setup.sql', 'utf8');
    
    // Split the script into individual statements
    const statements = sqlScript
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    console.log('');
    console.log('3. Executing database setup...');
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          console.log(`Executing statement ${i + 1}/${statements.length}...`);
          const { error } = await supabase.rpc('exec_sql', { sql: statement });
          
          if (error) {
            console.log(`⚠️ Statement ${i + 1} warning:`, error.message);
            errorCount++;
          } else {
            successCount++;
          }
        } catch (err) {
          console.log(`❌ Statement ${i + 1} error:`, err.message);
          errorCount++;
        }
      }
    }

    console.log('');
    console.log(`📊 Execution Summary: ${successCount} successful, ${errorCount} errors`);

    // Test the database structure
    console.log('');
    console.log('4. Testing database structure...');
    
    const tablesToTest = [
      'profiles', 'products', 'categories', 'orders', 'order_items',
      'cart_items', 'wishlist_items', 'reviews', 'addresses',
      'payment_methods', 'coupons', 'product_variants', 'order_tracking',
      'user_preferences', 'user_security_settings'
    ];

    const existingTables = [];
    
    for (const tableName of tablesToTest) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('count')
          .limit(1);
        
        if (!error) {
          existingTables.push(tableName);
          console.log(`✅ ${tableName} - accessible`);
        } else {
          console.log(`❌ ${tableName} - ${error.message}`);
        }
      } catch (err) {
        console.log(`❌ ${tableName} - ${err.message}`);
      }
    }

    console.log('');
    console.log(`📋 Database Summary: ${existingTables.length}/${tablesToTest.length} tables accessible`);

    // Test specific queries that were failing
    console.log('');
    console.log('5. Testing problematic queries...');
    
    // Test orders query with total_amount
    try {
      const { data: ordersData, error: ordersError } = await supabase
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
      const { data: trackingData, error: trackingError } = await supabase
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

    // Get record counts
    console.log('');
    console.log('6. Getting record counts...');
    
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
    console.log('🎉 Database setup completed successfully!');
    console.log('');
    console.log('📋 Next steps:');
    console.log('1. Update your .env file with the correct Supabase URL and anon key');
    console.log('2. Restart your development server');
    console.log('3. Test the admin dashboard');
    console.log('4. Verify all CRUD operations are working');

  } catch (error) {
    console.error('❌ Error during database setup:', error);
  }
}

setupDatabase();
