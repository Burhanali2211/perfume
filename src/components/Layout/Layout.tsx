import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { Breadcrumbs } from './Breadcrumbs';
import { CartSidebar } from '../Cart/CartSidebar';
import { CompareTray } from './CompareTray';


interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  const isDashboardPage = location.pathname.startsWith('/dashboard');

  return (
    <div className="min-h-screen transition-colors duration-300 bg-background-primary">

      {!isDashboardPage && (
        <Header
          onAuthClick={() => {}}
          onCartClick={() => setIsCartOpen(true)}
        />
      )}

      {!isHomePage && !isDashboardPage && (
        <div className="pt-20 pb-4">
          <Breadcrumbs />
        </div>
      )}

      <main className={`${!isHomePage ? "pt-8" : ""} relative`}>
        <div className="min-h-[calc(100vh-200px)]">
          {children}
        </div>
      </main>

      {!isDashboardPage && <Footer />}

      <CartSidebar
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
      />

      <CompareTray />
    </div>
  );
};