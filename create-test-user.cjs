const { createClient } = require('@supabase/supabase-js');

// Environment variables
const supabaseUrl = 'https://xqqjxcmgjivjytzzisyf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxcWp4Y21naml2anl0enppc3lmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NDIxMTAsImV4cCI6MjA3MjExODExMH0.bBJpSz70xLw5d0eYryOu6FAKCB0c_QovmtBufJjovAc';

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createTestUser() {
  try {
    console.log('Creating test admin user...');
    
    // Create a test admin user profile
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id: '33333333-3333-3333-3333-333333333333',
        email: 'admin@sufiessences.com',
        full_name: 'System Administrator',
        role: 'admin',
        is_active: true,
        email_verified: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select();

    if (error) {
      console.error('Error creating test user:', error);
      // Try updating if user already exists
      const { data: updateData, error: updateError } = await supabase
        .from('profiles')
        .update({
          role: 'admin',
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', '33333333-3333-3333-3333-333333333333')
        .select();
      
      if (updateError) {
        console.error('Error updating test user:', updateError);
        return;
      }
      
      console.log('Test user updated successfully:', updateData);
      return;
    }

    console.log('Test user created successfully:', data);
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

createTestUser();