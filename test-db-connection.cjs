const { createClient } = require('@supabase/supabase-js');

// Environment variables
const supabaseUrl = 'https://xqqjxcmgjivjytzzisyf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxcWp4Y21naml2anl0enppc3lmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NDIxMTAsImV4cCI6MjA3MjExODExMH0.bBJpSz70xLw5d0eYryOu6FAKCB0c_QovmtBufJjovAc';

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  try {
    console.log('Testing Supabase connection...');
    
    // Test basic connection
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    if (error) {
      console.error('Database connection failed:', error);
      return;
    }

    console.log('Database connection successful!');
    console.log('Data:', data);
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

testConnection();