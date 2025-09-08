import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const DirectLoginTest: React.FC = () => {
  const { user, loading, login, register } = useAuth();
  const [email, setEmail] = useState('admin@sufiessences.com');
  const [password, setPassword] = useState('password123');
  const [message, setMessage] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    console.log('Auth state:', { user, loading });
  }, [user, loading]);

  const handleLogin = async () => {
    try {
      setMessage('Logging in...');
      const error = await login(email, password);
      if (error) {
        setMessage(`Login failed: ${error}`);
      } else {
        setMessage('Login successful!');
      }
    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleRegister = async () => {
    try {
      setMessage('Registering...');
      const success = await register({
        email,
        password,
        name: 'Test Admin User',
        role: 'admin'
      });
      if (success) {
        setMessage('Registration successful! Please log in.');
        setIsRegistering(false);
      } else {
        setMessage('Registration failed.');
      }
    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-md mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">Direct Login Test</h1>
          
          {user ? (
            <div className="text-center">
              <h2 className="text-xl font-semibold text-green-600 mb-4">Logged In Successfully!</h2>
              <p className="text-gray-700 mb-2">User ID: {user.id}</p>
              <p className="text-gray-700 mb-2">Email: {user.email}</p>
              <p className="text-gray-700 mb-4">Role: {user.role}</p>
              <button
                onClick={() => window.location.href = '/'
                }
                className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors"
              >
                Go to Homepage
              </button>
            </div>
          ) : (
            <div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              
              {message && (
                <div className={`mb-4 p-3 rounded-md ${message.includes('successful') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {message}
                </div>
              )}
              
              <div className="space-y-3">
                <button
                  onClick={handleLogin}
                  className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors"
                >
                  Login
                </button>
                
                <button
                  onClick={() => setIsRegistering(!isRegistering)}
                  className="w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors"
                >
                  {isRegistering ? 'Cancel Registration' : 'Register New User'}
                </button>
                
                {isRegistering && (
                  <button
                    onClick={handleRegister}
                    className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
                  >
                    Register
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DirectLoginTest;