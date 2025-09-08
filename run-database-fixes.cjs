const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Use the correct Supabase configuration
const supabaseUrl = 'https://xqqjxcmgjivjytzzisyf.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxcWp4Y21naml2anl0enppc3lmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDU5NzQ5MCwiZXhwIjoyMDUwMTczNDkwfQ.8Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runDatabaseFixes() {
  try {
    console.log('Running database fixes...');
    
    // Create order_tracking table
    const createTableSQL = `
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
    `;
    
    const { error: createError } = await supabase.rpc('exec_sql', { sql: createTableSQL });
    if (createError) {
      console.error('Error creating table:', createError.message);
    } else {
      console.log('✅ order_tracking table created successfully');
    }
    
    // Add RLS policies
    const policiesSQL = `
      ALTER TABLE public.order_tracking ENABLE ROW LEVEL SECURITY;
      
      DROP POLICY IF EXISTS "order_tracking_select_policy" ON public.order_tracking;
      CREATE POLICY "order_tracking_select_policy" ON public.order_tracking
        FOR SELECT USING (
          EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND user_id = auth.uid()) OR
          public.is_admin() OR
          COALESCE(current_setting('app.development_mode', true)::boolean, false)
        );
      
      DROP POLICY IF EXISTS "order_tracking_insert_policy" ON public.order_tracking;
      CREATE POLICY "order_tracking_insert_policy" ON public.order_tracking
        FOR INSERT WITH CHECK (
          public.is_admin() OR
          COALESCE(current_setting('app.development_mode', true)::boolean, false)
        );
      
      DROP POLICY IF EXISTS "order_tracking_update_policy" ON public.order_tracking;
      CREATE POLICY "order_tracking_update_policy" ON public.order_tracking
        FOR UPDATE USING (
          public.is_admin() OR
          COALESCE(current_setting('app.development_mode', true)::boolean, false)
        );
    `;
    
    const { error: policiesError } = await supabase.rpc('exec_sql', { sql: policiesSQL });
    if (policiesError) {
      console.error('Error creating policies:', policiesError.message);
    } else {
      console.log('✅ RLS policies created successfully');
    }
    
    // Grant permissions
    const permissionsSQL = `
      GRANT ALL ON public.order_tracking TO authenticated;
      GRANT ALL ON public.order_tracking TO service_role;
      GRANT SELECT ON public.order_tracking TO anon;
    `;
    
    const { error: permissionsError } = await supabase.rpc('exec_sql', { sql: permissionsSQL });
    if (permissionsError) {
      console.error('Error granting permissions:', permissionsError.message);
    } else {
      console.log('✅ Permissions granted successfully');
    }
    
    // Create indexes
    const indexesSQL = `
      CREATE INDEX IF NOT EXISTS idx_order_tracking_order_id ON public.order_tracking(order_id);
      CREATE INDEX IF NOT EXISTS idx_order_tracking_status ON public.order_tracking(status);
      CREATE INDEX IF NOT EXISTS idx_order_tracking_created_at ON public.order_tracking(created_at);
    `;
    
    const { error: indexesError } = await supabase.rpc('exec_sql', { sql: indexesSQL });
    if (indexesError) {
      console.error('Error creating indexes:', indexesError.message);
    } else {
      console.log('✅ Indexes created successfully');
    }
    
    // Insert sample data
    const sampleDataSQL = `
      INSERT INTO public.order_tracking (order_id, status, location, description, tracking_number, carrier)
      SELECT 
        o.id,
        CASE 
          WHEN o.status = 'completed' THEN 'delivered'
          WHEN o.status = 'shipped' THEN 'in_transit'
          ELSE 'pending'
        END,
        CASE 
          WHEN o.status = 'completed' THEN 'Delivered to customer'
          WHEN o.status = 'shipped' THEN 'In transit to destination'
          ELSE 'Order being processed'
        END,
        CASE 
          WHEN o.status = 'completed' THEN 'Package delivered successfully'
          WHEN o.status = 'shipped' THEN 'Package is on its way'
          ELSE 'Order is being prepared for shipment'
        END,
        'TRK' || LPAD(EXTRACT(EPOCH FROM o.created_at)::TEXT, 10, '0'),
        'Standard Shipping'
      FROM public.orders o
      WHERE NOT EXISTS (SELECT 1 FROM public.order_tracking WHERE order_id = o.id)
      LIMIT 10;
    `;
    
    const { error: sampleError } = await supabase.rpc('exec_sql', { sql: sampleDataSQL });
    if (sampleError) {
      console.error('Error inserting sample data:', sampleError.message);
    } else {
      console.log('✅ Sample data inserted successfully');
    }
    
    console.log('🎉 All database fixes completed successfully!');
    
  } catch (error) {
    console.error('❌ Error running database fixes:', error);
  }
}

runDatabaseFixes();
