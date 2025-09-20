import { supabase } from '../lib/supabase';

export const testDatabaseConnection = async () => {
  try {
    console.log('Testing database connection...');
    
    // Test basic connection
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    if (error) {
      console.error('Database connection failed:', error);
      return { success: false, error: error.message };
    }

    console.log('Database connection successful:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Unexpected error:', error);
    return { success: false, error: (error as Error).message };
  }
};

// Run the test
testDatabaseConnection().then(result => {
  console.log('Test result:', result);
});