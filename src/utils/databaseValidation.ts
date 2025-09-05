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
      health.warnings.push('No data found in database - please run the setup scripts');
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
  report += `**Data:** ${health.sampleDataExists ? '✅ Available' : '⚠️ No data found'}\n\n`;

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
    report += '1. Run the SQL scripts in the supabase-scripts directory\n';
    report += '2. Check your environment variables\n';
    report += '3. Verify your Supabase project is active\n';
  } else if (!health.sampleDataExists) {
    report += '1. Run the sample data script: supabase-scripts/14-sample-data.sql\n';
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
        message: 'Data already exists in database'
      };
    }

    // Note: In a real implementation, profiles would be created through Supabase Auth
    // This function is kept for compatibility but should not be used in production

    return {
      success: false,
      message: 'Please use the SQL scripts in supabase-scripts directory to set up your database'
    };

  } catch (error) {
    return {
      success: false,
      message: `Unexpected error: ${(error as Error).message}`
    };
  }
};