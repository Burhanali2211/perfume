import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const TestPage: React.FC = () => {
  const [testResults, setTestResults] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const runTests = async () => {
      try {
        // Test 1: Basic connection
        const connectionTest = await supabase
          .from('profiles')
          .select('count')
          .limit(1);

        // Test 2: Check if tables exist
        const tableTest = await supabase
          .from('products')
          .select('count')
          .limit(1);

        // Test 3: Check functions
        let functionTest;
        try {
          functionTest = await supabase.rpc('is_admin');
        } catch (error) {
          functionTest = { error };
        }

        setTestResults({
          connection: connectionTest,
          tables: tableTest,
          functions: functionTest,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        setTestResults({
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        });
      } finally {
        setLoading(false);
      }
    };

    runTests();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Running database tests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Database Connection Test</h1>
        
        {testResults?.error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-red-800 mb-2">Error</h2>
            <p className="text-red-700">{testResults.error}</p>
            <p className="text-red-600 text-sm mt-2">Tested at: {testResults.timestamp}</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Connection Test</h2>
              <pre className="bg-gray-100 p-4 rounded overflow-x-auto text-sm">
                {JSON.stringify(testResults?.connection, null, 2)}
              </pre>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Tables Test</h2>
              <pre className="bg-gray-100 p-4 rounded overflow-x-auto text-sm">
                {JSON.stringify(testResults?.tables, null, 2)}
              </pre>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Functions Test</h2>
              <pre className="bg-gray-100 p-4 rounded overflow-x-auto text-sm">
                {JSON.stringify(testResults?.functions, null, 2)}
              </pre>
            </div>
          </div>
        )}

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-blue-800 mb-4">Next Steps</h2>
          <ul className="list-disc pl-5 space-y-2 text-blue-700">
            <li>If you see errors, check your Supabase configuration in .env file</li>
            <li>Make sure you've run the SQL scripts in the supabase-scripts directory</li>
            <li>Check that your Supabase project is active and accessible</li>
            <li>Verify your network connection and firewall settings</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TestPage;