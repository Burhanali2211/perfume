import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { WishlistProvider } from './contexts/WishlistContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ProductProvider } from './contexts/ProductContext';
import { CompareProvider } from './contexts/CompareContext';
import { ErrorProvider } from './contexts/ErrorContext';
import { OrderProvider } from './contexts/OrderContext';
import { AddressProvider } from './contexts/AddressContext';
import { RecommendationsProvider } from './contexts/RecommendationsContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Layout } from './components/Layout/Layout';
import { HomePage } from './pages/HomePage';
import { ProductsPage } from './pages/ProductsPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProfilePage } from './pages/ProfilePage';
import { CheckoutPage } from './pages/CheckoutPage';
import { SearchPage } from './pages/SearchPage';
import { WishlistPage } from './pages/WishlistPage';
import { OrdersPage } from './pages/OrdersPage';
import { ComparePage } from './pages/ComparePage';
import { NewArrivalsPage } from './pages/NewArrivalsPage';
import { DealsPage } from './pages/DealsPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { SettingsPage } from './pages/SettingsPage';
import { DatabaseErrorOverlay } from './components/Common/DatabaseErrorOverlay';
import { ErrorBoundary } from './components/Common/ErrorBoundary';
import { ScrollToTop } from './components/Common/ScrollToTop';
import { HeaderTest } from './components/Testing/HeaderTest';
import { DatabaseTest } from './components/Testing/DatabaseTest';
import './utils/performanceTest'; // Load performance testing utilities

function App() {
  return (
    <ErrorBoundary>
      <ErrorProvider>
        <ThemeProvider>
          <AuthProvider>
            <NotificationProvider>
              <ProductProvider>
                <RecommendationsProvider>
                  <CartProvider>
                    <WishlistProvider>
                      <CompareProvider>
                        <OrderProvider>
                          <AddressProvider>
                      <Router>
                        <ScrollToTop />
                        <Layout>
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
                            <Route path="/test-header" element={<HeaderTest />} />
                            <Route path="/test-database" element={<DatabaseTest />} />
                          </Routes>
                        </Layout>
                        <DatabaseErrorOverlay />
                      </Router>
                          </AddressProvider>
                        </OrderProvider>
                      </CompareProvider>
                    </WishlistProvider>
                  </CartProvider>
                </RecommendationsProvider>
              </ProductProvider>
            </NotificationProvider>
          </AuthProvider>
        </ThemeProvider>
      </ErrorProvider>
    </ErrorBoundary>
  );
}

export default App;
