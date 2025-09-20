const { createClient } = require('@supabase/supabase-js');

// Test different Supabase configurations
async function testSupabaseConfigurations() {
  console.log('🔍 Testing Supabase configurations...');
  console.log('');

  // Configuration options to test
  const configurations = [
    {
      name: 'Project from API (bxyzvaujvhumupwdmysh)',
      url: 'https://bxyzvaujvhumupwdmysh.supabase.co',
      key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxcWp4Y21naml2anl0enppc3lmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ1OTc0OTAsImV4cCI6MjA1MDE3MzQ5MH0.8Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q'
    },
    {
      name: 'Original Project (xqqjxcmgjivjytzzisyf)',
      url: 'https://xqqjxcmgjivjytzzisyf.supabase.co',
      key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxcWp4Y21naml2anl0enppc3lmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ1OTc0OTAsImV4cCI6MjA1MDE3MzQ5MH0.8Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q'
    }
  ];

  for (const config of configurations) {
    console.log(`Testing: ${config.name}`);
    console.log(`URL: ${config.url}`);
    console.log(`Key: ${config.key.substring(0, 20)}...`);
    
    try {
      const supabase = createClient(config.url, config.key);
      
      // Test basic connection
      const { data, error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);
      
      if (error) {
        console.log(`❌ Connection failed: ${error.message}`);
      } else {
        console.log(`✅ Connection successful!`);
        
        // Test table access
        const tables = ['profiles', 'products', 'orders', 'categories'];
        const accessibleTables = [];
        
        for (const table of tables) {
          try {
            const { data: tableData, error: tableError } = await supabase
              .from(table)
              .select('count')
              .limit(1);
            
            if (!tableError) {
              accessibleTables.push(table);
            }
          } catch (err) {
            // Table doesn't exist or not accessible
          }
        }
        
        console.log(`📋 Accessible tables: ${accessibleTables.join(', ')}`);
        
        if (accessibleTables.length > 0) {
          console.log('');
          console.log('🎉 WORKING CONFIGURATION FOUND!');
          console.log('');
          console.log('Use these values in your .env file:');
          console.log(`VITE_SUPABASE_URL=${config.url}`);
          console.log(`VITE_SUPABASE_ANON_KEY=${config.key}`);
          console.log('');
          
          // Create the .env file content
          const envContent = `VITE_SUPABASE_URL=${config.url}
VITE_SUPABASE_ANON_KEY=${config.key}
VITE_APP_ENV=development
VITE_DIRECT_LOGIN_ENABLED=true
`;
          
          require('fs').writeFileSync('.env', envContent);
          console.log('✅ Created .env file with working configuration');
          
          return config;
        }
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
    
    console.log('');
  }
  
  console.log('❌ No working configuration found.');
  console.log('');
  console.log('Please check:');
  console.log('1. Your Supabase project is active and not paused');
  console.log('2. You have the correct anon key from your Supabase dashboard');
  console.log('3. Your project URL is correct');
  console.log('');
  console.log('To get your anon key:');
  console.log('1. Go to https://supabase.com/dashboard');
  console.log('2. Select your project');
  console.log('3. Go to Settings > API');
  console.log('4. Copy the "anon public" key');
  
  return null;
}

// Run the test
testSupabaseConfigurations().then((workingConfig) => {
  if (workingConfig) {
    console.log('');
    console.log('🚀 Ready to set up database! Run: node setup-database.cjs');
  }
});
