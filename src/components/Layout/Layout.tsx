import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { Breadcrumbs } from './Breadcrumbs';
import { CartSidebar } from '../Cart/CartSidebar';
import { EnhancedAuthModal } from '../Auth/EnhancedAuthModal';
import { CompareTray } from './CompareTray';
import { useProducts } from '../../contexts/ProductContext';

import { Info } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { isUsingMockData } = useProducts();
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  return (
    <div className="min-h-screen transition-colors duration-300 bg-background-primary">
      {isUsingMockData && (
        <div className="bg-state-warning text-neutral-900 text-center py-3 text-sm font-medium flex items-center justify-center space-x-2 shadow-subtle">
          <Info className="h-4 w-4" />
          <span>Demonstration Mode: Displaying mock data as no products were found in the database.</span>
        </div>
      )}
      <Header
        onAuthClick={() => setIsAuthModalOpen(true)}
        onCartClick={() => setIsCartOpen(true)}
      />

      {!isHomePage && (
        <div className="pt-6 pb-4">
          <Breadcrumbs />
        </div>
      )}

      <main className={`${!isHomePage ? "pt-8" : ""} relative`}>
        <div className="min-h-[calc(100vh-200px)]">
          {children}
        </div>
      </main>

      <Footer />

      <EnhancedAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode="login"
      />

      <CartSidebar
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
      />

      <CompareTray />
    </div>
  );
};
