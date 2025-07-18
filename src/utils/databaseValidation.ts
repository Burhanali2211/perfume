import { supabase } from '../lib/supabase';

export interface DatabaseHealth {
  isConnected: boolean;
  tablesExist: boolean;
  rlsPoliciesEnabled: boolean;
  sampleDataExists: boolean;
  errors: string[];
  warnings: string[];
}

export const validateDatabaseSetup = async (): Promise<DatabaseHealth> => {
  const health: DatabaseHealth = {
    isConnected: false,
    tablesExist: false,
    rlsPoliciesEnabled: false,
    sampleDataExists: false,
    errors: [],
    warnings: []
  };

  try {
    // Test basic connection
    const { error: connectionError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    if (connectionError) {
      health.errors.push(`Database connection failed: ${connectionError.message}`);
      return health;
    }

    health.isConnected = true;

    // Check if required tables exist
    const requiredTables = ['profiles', 'products', 'reviews', 'cart_items', 'wishlist_items', 'orders', 'order_items'];
    const tableChecks = await Promise.allSettled(
      requiredTables.map(table => 
        supabase.from(table).select('*').limit(1)
      )
    );

    const missingTables = tableChecks
      .map((result, index) => ({ table: requiredTables[index], result }))
      .filter(({ result }) => result.status === 'rejected')
      .map(({ table }) => table);

    if (missingTables.length > 0) {
      health.errors.push(`Missing tables: ${missingTables.join(', ')}`);
    } else {
      health.tablesExist = true;
    }

    // Check RLS policies (basic check)
    try {
      const { error: rlsError } = await supabase
        .from('profiles')
        .select('*')
        .limit(1);

      if (rlsError && rlsError.message.includes('row-level security')) {
        health.errors.push('Row Level Security policies are not properly configured');
      } else {
        health.rlsPoliciesEnabled = true;
      }
    } catch {
      health.warnings.push('Could not verify RLS policies');
    }

    // Check for sample data
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .limit(5);

    const { data: productsData } = await supabase
      .from('products')
      .select('*')
      .limit(5);

    if (data && data.length > 0 && productsData && productsData.length > 0) {
      health.sampleDataExists = true;
    } else {
      health.warnings.push('No sample data found - application will use mock data');
    }

    // Additional checks
    if (health.isConnected && health.tablesExist) {
      // Check for required functions
      try {
        const { error: functionError } = await supabase.rpc('is_admin');
        if (functionError) {
          health.warnings.push('Database functions may not be properly installed');
        }
      } catch {
        health.warnings.push('Could not verify database functions');
      }
    }

  } catch (error) {
    health.errors.push(`Unexpected error during validation: ${(error as Error).message}`);
  }

  return health;
};

export const generateDatabaseReport = (health: DatabaseHealth): string => {
  let report = '# Database Health Report\n\n';
  
  report += `**Connection Status:** ${health.isConnected ? '✅ Connected' : '❌ Failed'}\n`;
  report += `**Tables:** ${health.tablesExist ? '✅ All tables exist' : '❌ Missing tables'}\n`;
  report += `**Security:** ${health.rlsPoliciesEnabled ? '✅ RLS enabled' : '❌ RLS issues'}\n`;
  report += `**Sample Data:** ${health.sampleDataExists ? '✅ Available' : '⚠️ Using mock data'}\n\n`;

  if (health.errors.length > 0) {
    report += '## ❌ Errors\n';
    health.errors.forEach(error => {
      report += `- ${error}\n`;
    });
    report += '\n';
  }

  if (health.warnings.length > 0) {
    report += '## ⚠️ Warnings\n';
    health.warnings.forEach(warning => {
      report += `- ${warning}\n`;
    });
    report += '\n';
  }

  if (health.errors.length === 0 && health.warnings.length === 0) {
    report += '## ✅ All checks passed!\n';
    report += 'Your database is properly configured and ready to use.\n\n';
  }

  report += '## Next Steps\n';
  if (health.errors.length > 0) {
    report += '1. Run the SQL schema in your Supabase SQL Editor\n';
    report += '2. Check your environment variables\n';
    report += '3. Verify your Supabase project is active\n';
  } else if (!health.sampleDataExists) {
    report += '1. Consider adding sample data for testing\n';
    report += '2. Create admin, seller, and customer accounts\n';
  } else {
    report += '1. Your setup is complete!\n';
    report += '2. You can start using the application\n';
  }

  return report;
};

export const createSampleData = async (): Promise<{ success: boolean; message: string }> => {
  try {
    // Check if sample data already exists
    const { data: existingProfiles } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);

    if (existingProfiles && existingProfiles.length > 0) {
      return {
        success: false,
        message: 'Sample data already exists'
      };
    }

    // Create sample profiles (these would need to be created through Supabase Auth first)
    const sampleProfiles = [
      {
        id: '00000000-0000-0000-0000-000000000001',
        full_name: 'Admin User',
        role: 'admin'
      },
      {
        id: '00000000-0000-0000-0000-000000000002',
        full_name: 'Demo Seller',
        role: 'seller'
      },
      {
        id: '00000000-0000-0000-0000-000000000003',
        full_name: 'Demo Customer',
        role: 'customer'
      }
    ];

    const { error: profileError } = await supabase
      .from('profiles')
      .insert(sampleProfiles);

    if (profileError) {
      return {
        success: false,
        message: `Failed to create sample profiles: ${profileError.message}`
      };
    }

    // Create sample products
    const sampleProducts = [
      {
        name: 'Sample Product 1',
        description: 'A great product for testing the platform',
        price: 29.99,
        category: 'Electronics',
        stock: 100,
        seller_id: '00000000-0000-0000-0000-000000000002',
        seller_name: 'Demo Seller',
        images: ['https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800&h=800&fit=crop']
      },
      {
        name: 'Sample Product 2',
        description: 'Another amazing product for demonstration',
        price: 49.99,
        category: 'Fashion',
        stock: 50,
        seller_id: '00000000-0000-0000-0000-000000000002',
        seller_name: 'Demo Seller',
        images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=800&fit=crop']
      }
    ];

    const { error: productError } = await supabase
      .from('products')
      .insert(sampleProducts);

    if (productError) {
      return {
        success: false,
        message: `Failed to create sample products: ${productError.message}`
      };
    }

    return {
      success: true,
      message: 'Sample data created successfully'
    };

  } catch (error) {
    return {
      success: false,
      message: `Unexpected error: ${(error as Error).message}`
    };
  }
};
