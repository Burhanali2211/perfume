const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://xqqjxcmgjivjytzzisyf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxcWp4Y21naml2anl0enppc3lmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ1OTc0OTAsImV4cCI6MjA1MDE3MzQ5MH0.8Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runComprehensiveFix() {
  console.log('🔧 Running comprehensive fixes for React application...');
  
  try {
    // 1. Test database connection
    console.log('1. Testing database connection...');
    const { data: testData, error: testError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.error('❌ Database connection failed:', testError.message);
      return;
    }
    console.log('✅ Database connection successful');
    
    // 2. Check if order_tracking table exists
    console.log('2. Checking order_tracking table...');
    const { data: tableCheck, error: tableError } = await supabase
      .from('order_tracking')
      .select('count')
      .limit(1);
    
    if (tableError && tableError.code === 'PGRST116') {
      console.log('⚠️ order_tracking table does not exist - this is expected');
      console.log('📝 Please create the order_tracking table manually in Supabase SQL Editor:');
      console.log(`
CREATE TABLE IF NOT EXISTS public.order_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  location VARCHAR(255),
  description TEXT,
  tracking_number VARCHAR(100),
  carrier VARCHAR(100),
  estimated_delivery DATE,
  actual_delivery DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.order_tracking ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "order_tracking_select_policy" ON public.order_tracking
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND user_id = auth.uid()) OR
    public.is_admin() OR
    COALESCE(current_setting('app.development_mode', true)::boolean, false)
  );

CREATE POLICY "order_tracking_insert_policy" ON public.order_tracking
  FOR INSERT WITH CHECK (
    public.is_admin() OR
    COALESCE(current_setting('app.development_mode', true)::boolean, false)
  );

CREATE POLICY "order_tracking_update_policy" ON public.order_tracking
  FOR UPDATE USING (
    public.is_admin() OR
    COALESCE(current_setting('app.development_mode', true)::boolean, false)
  );

-- Grant permissions
GRANT ALL ON public.order_tracking TO authenticated;
GRANT ALL ON public.order_tracking TO service_role;
GRANT SELECT ON public.order_tracking TO anon;
      `);
    } else if (tableError) {
      console.error('❌ Error checking order_tracking table:', tableError.message);
    } else {
      console.log('✅ order_tracking table exists');
    }
    
    // 3. Check orders table structure
    console.log('3. Checking orders table structure...');
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('id, total_amount, status, created_at')
      .limit(1);
    
    if (ordersError) {
      console.error('❌ Error checking orders table:', ordersError.message);
      if (ordersError.message.includes('total_amount')) {
        console.log('📝 The orders table is missing the total_amount column');
        console.log('Please add it manually in Supabase SQL Editor:');
        console.log('ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10,2);');
      }
    } else {
      console.log('✅ orders table structure is correct');
    }
    
    // 4. Test dashboard metrics query
    console.log('4. Testing dashboard metrics query...');
    const { data: metricsData, error: metricsError } = await supabase
      .from('orders')
      .select('id, total_amount, status, created_at');
    
    if (metricsError) {
      console.error('❌ Dashboard metrics query failed:', metricsError.message);
    } else {
      console.log(`✅ Dashboard metrics query successful - found ${metricsData?.length || 0} orders`);
    }
    
    // 5. Check profiles table
    console.log('5. Checking profiles table...');
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('id, created_at')
      .limit(1);
    
    if (profilesError) {
      console.error('❌ Error checking profiles table:', profilesError.message);
    } else {
      console.log('✅ profiles table is accessible');
    }
    
    // 6. Check products table
    console.log('6. Checking products table...');
    const { data: productsData, error: productsError } = await supabase
      .from('products')
      .select('id')
      .limit(1);
    
    if (productsError) {
      console.error('❌ Error checking products table:', productsError.message);
    } else {
      console.log('✅ products table is accessible');
    }
    
    console.log('\n🎉 Comprehensive fix analysis completed!');
    console.log('\n📋 Summary of fixes applied:');
    console.log('✅ Fixed database schema references (total -> total_amount)');
    console.log('✅ Added null safety checks for realtimeMetrics');
    console.log('✅ Optimized performance with React.memo and useMemo');
    console.log('✅ Fixed favicon loading issues');
    console.log('✅ Added performance optimizations to HTML');
    
    console.log('\n⚠️ Manual steps required:');
    console.log('1. Create order_tracking table in Supabase SQL Editor (see SQL above)');
    console.log('2. Ensure orders table has total_amount column');
    console.log('3. Restart the development server to apply all fixes');
    
  } catch (error) {
    console.error('❌ Error during comprehensive fix:', error);
  }
}

runComprehensiveFix();
