import React, { useState } from 'react';
import { crudTestingService, TestSuite } from '../../../services/crudTestingService';
import { useNotification } from '../../../contexts/NotificationContext';
import { LoadingSpinner } from '../../Common/LoadingSpinner';
import {
  Play,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  AlertTriangle,
  TrendingUp
} from 'lucide-react';

export const CRUDTestRunner: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<TestSuite[]>([]);
  const [selectedSuite, setSelectedSuite] = useState<string | null>(null);
  const { showNotification } = useNotification();

  const runTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    
    try {
      showNotification({
        type: 'info',
        title: 'Running Tests',
        message: 'Starting comprehensive CRUD tests...'
      });

      const results = await crudTestingService.runAllTests();
      setTestResults(results);

      const totalPassed = results.reduce((sum, suite) => sum + suite.passed, 0);
      const totalFailed = results.reduce((sum, suite) => sum + suite.failed, 0);
      const successRate = ((totalPassed / (totalPassed + totalFailed)) * 100).toFixed(1);

      showNotification({
        type: totalFailed === 0 ? 'success' : 'warning',
        title: 'Tests Completed',
        message: `${totalPassed} passed, ${totalFailed} failed (${successRate}% success rate)`
      });
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Test Error',
        message: 'Failed to run tests. Please check the console for details.'
      });
      console.error('Test execution failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (passed: boolean) => {
    return passed ? (
      <CheckCircle className="h-5 w-5 text-green-500" />
    ) : (
      <XCircle className="h-5 w-5 text-red-500" />
    );
  };

  const getStatusColor = (passed: boolean) => {
    return passed ? 'text-green-600' : 'text-red-600';
  };

  const getSuiteStatusColor = (suite: TestSuite) => {
    if (suite.failed === 0) return 'bg-green-100 border-green-200';
    if (suite.passed === 0) return 'bg-red-100 border-red-200';
    return 'bg-yellow-100 border-yellow-200';
  };

  const calculateOverallStats = () => {
    const totalPassed = testResults.reduce((sum, suite) => sum + suite.passed, 0);
    const totalFailed = testResults.reduce((sum, suite) => sum + suite.failed, 0);
    const totalDuration = testResults.reduce((sum, suite) => sum + suite.totalDuration, 0);
    const successRate = totalPassed + totalFailed > 0 ? ((totalPassed / (totalPassed + totalFailed)) * 100) : 0;

    return { totalPassed, totalFailed, totalDuration, successRate };
  };

  const stats = calculateOverallStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">CRUD Test Runner</h2>
            <p className="text-gray-600 mt-1">
              Comprehensive testing of all CRUD operations and system functionality
            </p>
          </div>
          <button
            onClick={runTests}
            disabled={isRunning}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRunning ? (
              <>
                <LoadingSpinner size="sm" />
                <span>Running Tests...</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                <span>Run All Tests</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Overall Statistics */}
      {testResults.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Passed</p>
                <p className="text-2xl font-semibold text-green-600">{stats.totalPassed}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <XCircle className="h-8 w-8 text-red-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Failed</p>
                <p className="text-2xl font-semibold text-red-600">{stats.totalFailed}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-blue-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Success Rate</p>
                <p className="text-2xl font-semibold text-blue-600">{stats.successRate.toFixed(1)}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-purple-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Duration</p>
                <p className="text-2xl font-semibold text-purple-600">{stats.totalDuration}ms</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Test Suites */}
      {testResults.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Test Results</h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {testResults.map((suite, index) => (
              <div
                key={index}
                className={`border rounded-lg p-4 cursor-pointer transition-all ${getSuiteStatusColor(suite)} ${
                  selectedSuite === suite.name ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => setSelectedSuite(selectedSuite === suite.name ? null : suite.name)}
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-gray-900">{suite.name}</h4>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-green-600">{suite.passed} passed</span>
                    {suite.failed > 0 && (
                      <span className="text-sm text-red-600">{suite.failed} failed</span>
                    )}
                  </div>
                </div>
                
                <div className="mt-2 flex items-center justify-between text-sm text-gray-600">
                  <span>{suite.tests.length} total tests</span>
                  <span>{suite.totalDuration}ms</span>
                </div>

                {/* Progress Bar */}
                <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all"
                    style={{
                      width: `${suite.tests.length > 0 ? (suite.passed / suite.tests.length) * 100 : 0}%`
                    }}
                  />
                </div>

                {/* Detailed Test Results */}
                {selectedSuite === suite.name && (
                  <div className="mt-4 space-y-2">
                    {suite.tests.map((test, testIndex) => (
                      <div
                        key={testIndex}
                        className="flex items-center justify-between p-2 bg-white rounded border"
                      >
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(test.passed)}
                          <span className={`text-sm ${getStatusColor(test.passed)}`}>
                            {test.testName}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <span>{test.duration}ms</span>
                          {test.error && (
                            <AlertTriangle className="h-4 w-4 text-red-500" title={test.error} />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      {testResults.length === 0 && !isRunning && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start">
            <FileText className="h-6 w-6 text-blue-600 mt-1" />
            <div className="ml-3">
              <h3 className="text-lg font-medium text-blue-900">About CRUD Testing</h3>
              <div className="mt-2 text-blue-700">
                <p className="mb-2">
                  This test runner validates all CRUD (Create, Read, Update, Delete) operations across the application:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Product management operations</li>
                  <li>Category management operations</li>
                  <li>User management operations</li>
                  <li>Order management operations</li>
                  <li>Collection, New Arrivals, and Offers management</li>
                  <li>Bulk operations functionality</li>
                  <li>Data validation rules</li>
                  <li>Real-time updates and synchronization</li>
                </ul>
                <p className="mt-3 text-sm">
                  Click "Run All Tests" to start the comprehensive testing process.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
