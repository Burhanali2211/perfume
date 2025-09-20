import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { WishlistProvider } from './contexts/WishlistContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ProductProvider } from './contexts/ProductContext';
import { Layout } from './components/Layout/Layout';
import { ErrorBoundary } from './components/Common/ErrorBoundary';
import { ScrollToTop } from './components/Common/ScrollToTop';
import { LoadingSpinner } from './components/Common/LoadingSpinner';

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

  return (
    <ErrorBoundary>
      <AuthProvider>
        <NotificationProvider>
          <ProductProvider>
            <CartProvider>
              <WishlistProvider>
                <Router>
                  <ScrollToTop />
                  <Layout>
                    <main id="main-content" className="focus:outline-none">
                      <Suspense fallback={<PageLoadingFallback />}>
                        <Routes>
                          <Route path="/" element={<HomePage />} />
                          <Route path="/products" element={<ProductsPage />} />
                          <Route path="/products/:id" element={<ProductDetailPage />} />
                          <Route path="/search" element={<SearchPage />} />
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
                          <Route path="*" element={<NotFoundPage />} />
                        </Routes>
                      </Suspense>
                    </main>
                  </Layout>
                </Router>
              </WishlistProvider>
            </CartProvider>
          </ProductProvider>
        </NotificationProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;