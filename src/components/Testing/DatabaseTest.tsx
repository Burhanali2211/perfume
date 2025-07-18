import React, { useState, useEffect } from 'react';
import { databaseTester, DatabaseTestResult } from '../../utils/databaseTest';
import { performanceMonitor } from '../../utils/performance';
import { CheckCircle, XCircle, Clock, Database, AlertTriangle, RefreshCw } from 'lucide-react';

export const DatabaseTest: React.FC = () => {
  const [testResults, setTestResults] = useState<DatabaseTestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [summary, setSummary] = useState<any>(null);
  const [performanceStats, setPerformanceStats] = useState<any>(null);

  const runTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    setSummary(null);
    
    try {
      const results = await databaseTester.runAllTests();
      setTestResults(results);
      setSummary(databaseTester.getSummary());
      setPerformanceStats(performanceMonitor.getStats());
    } catch (error) {
      console.error('Failed to run database tests:', error);
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    // Auto-run tests on component mount
    runTests();
  }, []);

  const getStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="h-5 w-5 text-green-500" />
    ) : (
      <XCircle className="h-5 w-5 text-red-500" />
    );
  };

  const getDurationColor = (duration: number) => {
    if (duration > 2000) return 'text-red-600';
    if (duration > 1000) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Database className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Database Connectivity Test</h1>
              <p className="text-gray-600">Diagnose database timeout and performance issues</p>
            </div>
          </div>
          <button
            onClick={runTests}
            disabled={isRunning}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`h-4 w-4 ${isRunning ? 'animate-spin' : ''}`} />
            <span>{isRunning ? 'Running Tests...' : 'Run Tests'}</span>
          </button>
        </div>

        {/* Summary */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{summary.total}</div>
              <div className="text-sm text-blue-800">Total Tests</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{summary.successful}</div>
              <div className="text-sm text-green-800">Successful</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{summary.failed}</div>
              <div className="text-sm text-red-800">Failed</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {summary.averageDuration.toFixed(0)}ms
              </div>
              <div className="text-sm text-yellow-800">Avg Duration</div>
            </div>
          </div>
        )}

        {/* Test Results */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Test Results</h2>
          
          {isRunning && testResults.length === 0 && (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center space-x-3">
                <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
                <span className="text-gray-600">Running database tests...</span>
              </div>
            </div>
          )}

          {testResults.map((result, index) => (
            <div
              key={index}
              className={`border rounded-lg p-4 ${
                result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(result.success)}
                  <div>
                    <h3 className="font-medium text-gray-900">{result.test}</h3>
                    {result.error && (
                      <p className="text-sm text-red-600 mt-1">{result.error}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className={`text-sm font-medium ${getDurationColor(result.duration)}`}>
                      {result.duration.toFixed(0)}ms
                    </span>
                  </div>
                  {result.details && (
                    <div className="text-sm text-gray-600">
                      {JSON.stringify(result.details)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Performance Stats */}
        {performanceStats && (
          <div className="mt-6 bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Performance Statistics</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-gray-600">Success Rate</div>
                <div className="text-lg font-semibold text-gray-900">
                  {performanceStats.successRate.toFixed(1)}%
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Total Requests</div>
                <div className="text-lg font-semibold text-gray-900">
                  {performanceStats.totalRequests}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Average Time</div>
                <div className="text-lg font-semibold text-gray-900">
                  {performanceStats.averageTime.toFixed(0)}ms
                </div>
              </div>
            </div>
            
            {performanceStats.slowestOperation && (
              <div className="mt-4 p-3 bg-yellow-100 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-800">Slowest Operation</span>
                </div>
                <div className="text-sm text-yellow-700 mt-1">
                  {performanceStats.slowestOperation.name}: {performanceStats.slowestOperation.duration.toFixed(0)}ms
                </div>
              </div>
            )}
          </div>
        )}

        {/* Recommendations */}
        {summary && summary.failed > 0 && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <h3 className="text-lg font-semibold text-red-800">Issues Detected</h3>
            </div>
            <div className="space-y-2 text-sm text-red-700">
              <p>• {summary.failed} out of {summary.total} tests failed</p>
              <p>• Check your Supabase connection and database configuration</p>
              <p>• Verify that all required tables and indexes exist</p>
              <p>• Consider optimizing slow queries (&gt;1000ms)</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
