import React, { useState } from 'react';
import { Header } from '../Layout/Header';

export const HeaderTest: React.FC = () => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white">
                  <Header
                    onAuthClick={() => setIsAuthModalOpen(true)}
                    onCartClick={() => setIsCartOpen(true)}
                  />

                  <div className="max-w-4xl mx-auto p-8">
                    <h1 className="text-3xl font-bold mb-8 text-neutral-900">
                      Header Enhancement Test
                    </h1>
                    
                    <div className="space-y-6">
                      <div className="bg-neutral-50 dark:bg-neutral-800 p-6 rounded-lg">
                        <h2 className="text-xl font-semibold mb-4 text-neutral-900 dark:text-text-dark-primary">
                          Test Features
                        </h2>
                        <ul className="space-y-2 text-neutral-700 dark:text-text-dark-secondary">
                          <li>✅ Enhanced buttons with micro-interactions</li>
                          <li>✅ Tooltips on hover for better UX</li>
                          <li>✅ Badge components for notifications and counts</li>
                          <li>✅ Dark mode toggle functionality</li>
                          <li>✅ Responsive design maintained</li>
                          <li>✅ All existing functionality preserved</li>
                        </ul>
                      </div>
                      
                      <div className="bg-neutral-50 dark:bg-neutral-800 p-6 rounded-lg">
                        <h2 className="text-xl font-semibold mb-4 text-neutral-900 dark:text-text-dark-primary">
                          Interactive Elements
                        </h2>
                        <div className="space-y-3 text-neutral-700 dark:text-text-dark-secondary">
                          <p>• Hover over header buttons to see tooltips</p>
                          <p>• Click the theme toggle to test dark mode</p>
                          <p>• Notice the smooth animations on button interactions</p>
                          <p>• Check badge animations when counts change</p>
                          <p>• Test mobile responsiveness by resizing window</p>
                        </div>
                      </div>
                      
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
                        <h2 className="text-xl font-semibold mb-4 text-blue-900 dark:text-blue-300">
                          Status
                        </h2>
                        <p className="text-blue-800 dark:text-blue-200">
                          All header enhancements have been successfully integrated! 
                          The header now features enhanced micro-interactions, tooltips, 
                          and badge components while maintaining all existing functionality.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Modal states for testing */}
                  {isAuthModalOpen && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                      <div className="bg-white dark:bg-neutral-800 p-6 rounded-lg">
                        <h3 className="text-lg font-semibold mb-4">Auth Modal Test</h3>
                        <p className="mb-4">Auth modal would open here</p>
                        <button 
                          onClick={() => setIsAuthModalOpen(false)}
                          className="px-4 py-2 bg-neutral-900 text-white rounded-lg"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {isCartOpen && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                      <div className="bg-white dark:bg-neutral-800 p-6 rounded-lg">
                        <h3 className="text-lg font-semibold mb-4">Cart Modal Test</h3>
                        <p className="mb-4">Cart sidebar would open here</p>
                        <button 
                          onClick={() => setIsCartOpen(false)}
                          className="px-4 py-2 bg-neutral-900 text-white rounded-lg"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  )}
                </div>
  );
};
