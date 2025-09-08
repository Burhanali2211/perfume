import React, { Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { WishlistProvider } from './contexts/WishlistContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ProductProvider } from './contexts/ProductContext';
import { CollectionProvider } from './contexts/CollectionContext';
import { CompareProvider } from './contexts/CompareContext';
import { ErrorProvider } from './contexts/ErrorContext';
import { OrderProvider } from './contexts/OrderContext';
import { AddressProvider } from './contexts/AddressContext';
import { RecommendationsProvider } from './contexts/RecommendationsContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthModalProvider } from './contexts/AuthModalContext';
import { MonitoringProvider } from './contexts/MonitoringContext';
import { Layout } from './components/Layout/Layout';
import { DatabaseErrorOverlay } from './components/Common/DatabaseErrorOverlay';
import { ErrorBoundary } from './components/Common/ErrorBoundary';
import { ScrollToTop } from './components/Common/ScrollToTop';
import { LoadingSpinner } from './components/Common/LoadingSpinner';
import { PerformanceOptimizer } from './components/Performance/LCPOptimizer';
import { GlobalMediaErrorHandler } from './components/Common/MediaErrorHandler';
import { SkipLink } from './utils/accessibilityEnhancements';

// Lazy-loaded pages for code splitting
const HomePage = React.lazy(() => import('./pages/HomePage.tsx'));
const ProductsPage = React.lazy(() => import('./pages/ProductsPage.tsx'));
const ProductDetailPage = React.lazy(() => import('./pages/ProductDetailPage.tsx'));
const DashboardPage = React.lazy(() => import('./pages/DashboardPage.tsx'));
const ProfilePage = React.lazy(() => import('./pages/ProfilePage.tsx'));
const CheckoutPage = React.lazy(() => import('./pages/CheckoutPage.tsx'));
const SearchPage = React.lazy(() => import('./pages/SearchPage.tsx'));
const WishlistPage = React.lazy(() => import('./pages/WishlistPage.tsx'));
const OrdersPage = React.lazy(() => import('./pages/OrdersPage.tsx'));
const ComparePage = React.lazy(() => import('./pages/ComparePage.tsx'));
const NewArrivalsPage = React.lazy(() => import('./pages/NewArrivalsPage.tsx'));
const DealsPage = React.lazy(() => import('./pages/DealsPage.tsx'));
const CategoriesPage = React.lazy(() => import('./pages/CategoriesPage.tsx'));
const CollectionsPage = React.lazy(() => import('./pages/CollectionsPage.tsx'));
const SettingsPage = React.lazy(() => import('./pages/SettingsPage.tsx'));
const AuthPage = React.lazy(() => import('./pages/AuthPage.tsx'));
const HealthPage = React.lazy(() => import('./pages/HealthPage.tsx'));
const TestPage = React.lazy(() => import('./pages/TestPage.tsx'));
const DirectLoginTest = React.lazy(() => import('./pages/DirectLoginTest.tsx'));
const NotFoundPage = React.lazy(() => import('./pages/NotFoundPage.tsx'));

// Loading fallback component
const PageLoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-background-primary">
    <div className="text-center">
      <LoadingSpinner size="large" />
      <p className="mt-4 text-text-secondary">Loading page...</p>
    </div>
  </div>
);

function App() {
  // Handle media errors globally
  useEffect(() => {
    const handleMediaError = (e: Event) => {
      const target = e.target as HTMLMediaElement;
      console.warn('Media error caught:', {
        src: target.src,
        tagName: target.tagName,
        error: target.error
      });
      
      // Prevent the error from propagating
      e.stopImmediatePropagation();
    };

    // Add event listeners for media elements
    document.addEventListener('error', handleMediaError, true);
    
    return () => {
      document.removeEventListener('error', handleMediaError, true);
    };
  }, []);

  // Initialize accessibility features
  useEffect(() => {
    // This will add skip links and other accessibility features
    const initializeAccessibility = async () => {
      const { initializeAccessibility } = await import('./utils/accessibilityEnhancements');
      initializeAccessibility();
    };
    
    initializeAccessibility();
  }, []);

  // Initialize monitoring
  useEffect(() => {
    const initializeMonitoring = async () => {
      const { initMonitoring } = await import('./utils/monitoring');
      
      // Initialize monitoring with configuration
      initMonitoring({
        sentry: {
          dsn: import.meta.env.VITE_SENTRY_DSN || '',
          environment: import.meta.env.MODE || 'development',
          release: import.meta.env.VITE_APP_VERSION || '1.0.0',
          tracesSampleRate: import.meta.env.MODE === 'development' ? 1.0 : 0.1
        },
        logRocket: {
          appId: import.meta.env.VITE_LOGROCKET_APP_ID || ''
        }
      });
    };
    
    initializeMonitoring();
  }, []);

  return (
    <ErrorBoundary>
      <PerformanceOptimizer
        enableLCPMonitoring={true}
        preloadResources={[]}
        criticalImages={[]}
      >
        <ErrorProvider>
          <ThemeProvider>
            <AuthProvider>
              <NotificationProvider>
                <AuthModalProvider>
                  <ProductProvider>
                    <CollectionProvider>
                      <RecommendationsProvider>
                        <CartProvider>
                        <WishlistProvider>
                          <CompareProvider>
                            <OrderProvider>
                              <AddressProvider>
                                <MonitoringProvider>
                                  <Router>
                                    <GlobalMediaErrorHandler />
                                    <ScrollToTop />
                                    <SkipLink href="#main-content">Skip to main content</SkipLink>
                                    <Layout>
                                      <main id="main-content" className="focus:outline-none">
                                        <Suspense fallback={<PageLoadingFallback />}>
                                          <Routes>
                                            <Route path="/" element={<HomePage />} />
                                            <Route path="/products" element={<ProductsPage />} />
                                            <Route path="/products/:id" element={<ProductDetailPage />} />
                                            <Route path="/search" element={<SearchPage />} />
                                            <Route path="/compare" element={<ComparePage />} />
                                            <Route path="/dashboard" element={<DashboardPage />} />
                                            <Route path="/profile" element={<ProfilePage />} />
                                            <Route path="/wishlist" element={<WishlistPage />} />
                                            <Route path="/orders" element={<OrdersPage />} />
                                            <Route path="/checkout" element={<CheckoutPage />} />
                                            <Route path="/settings" element={<SettingsPage />} />
                                            <Route path="/new-arrivals" element={<NewArrivalsPage />} />
                                            <Route path="/deals" element={<DealsPage />} />
                                            <Route path="/categories" element={<CategoriesPage />} />
                                            <Route path="/categories/:slug" element={<ProductsPage />} />
                                            <Route path="/collections" element={<CollectionsPage />} />
                                            <Route path="/collections/:slug" element={<ProductsPage />} />
                                            <Route path="/auth" element={<AuthPage />} />
                                            <Route path="/health" element={<HealthPage />} />
                                            <Route path="/test" element={<TestPage />} />
                                            <Route path="/direct-login-test" element={<DirectLoginTest />} />
                                            <Route path="*" element={<NotFoundPage />} />
                                          </Routes>
                                        </Suspense>
                                      </main>
                                    </Layout>
                                    <DatabaseErrorOverlay />
                                  </Router>
                                </MonitoringProvider>
                              </AddressProvider>
                            </OrderProvider>
                          </CompareProvider>
                        </WishlistProvider>
                      </CartProvider>
                    </RecommendationsProvider>
                  </CollectionProvider>
                </ProductProvider>
                </AuthModalProvider>
              </NotificationProvider>
            </AuthProvider>
          </ThemeProvider>
        </ErrorProvider>
      </PerformanceOptimizer>
    </ErrorBoundary>
  );
}

export default App;