import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, ShoppingCart, User, Menu, X, Heart, LogOut, Settings, Package,
  Plus, ChevronDown
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';

import { SearchOverlay } from './SearchOverlay';
import { Logo } from './Logo';
import { EnhancedButton, Badge, Tooltip } from '../Common/EnhancedButton';
import { MobileTouchButton, MobileIconButton } from '../Mobile/MobileTouchButton';
import { useMobileDetection } from '../../hooks/useMobileGestures';

interface HeaderProps {
  onAuthClick: () => void;
  onCartClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onAuthClick, onCartClick }) => {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const { items: wishlistItems } = useWishlist();
  const { isMobile } = useMobileDetection();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const location = useLocation();

  const navigationItems = [
    { name: 'Home', href: '/' },
    { name: 'Products', href: '/products' },
    {
      name: 'Categories',
      href: '/categories',
      hasDropdown: true,
      dropdownItems: [
        { name: 'Electronics', href: '/categories/electronics' },
        { name: 'Fashion', href: '/categories/fashion' },
        { name: 'Home & Garden', href: '/categories/home-garden' },
        { name: 'Sports', href: '/categories/sports' },
        { name: 'Books', href: '/categories/books' },
      ]
    },
    { name: 'Deals', href: '/deals' },
    { name: 'New Arrivals', href: '/new-arrivals' },
  ];



  const isActiveLink = (href: string) => {
    return location.pathname === href;
  };

  // Close mobile menu on route change
  useEffect(() => {
    if (isMenuOpen) {
      setIsMenuOpen(false);
    }
  }, [location.pathname, isMenuOpen]);

  return (
    <>
      <header className="sticky top-0 left-0 right-0 z-50 transition-all duration-500 ease-out backdrop-blur-3xl border-b bg-white/95 border-neutral-100/60 shadow-[0_1px_20px_rgba(0,0,0,0.02)]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <Logo />

            {/* Luxury Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-10" role="navigation" aria-label="Main navigation">
              {navigationItems.map((item) => (
                <div key={item.name} className="relative group">
                  {item.hasDropdown ? (
                    <div className="relative">
                      <button
                        onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
                        className={`relative text-sm font-medium tracking-wide transition-all duration-300 py-3 px-1 flex items-center space-x-2 ${
                          isActiveLink(item.href)
                            ? 'text-neutral-900'
                            : 'text-neutral-600 hover:text-neutral-900'
                        } group-hover:text-neutral-900`}
                        aria-expanded={isCategoriesOpen}
                      >
                        <span className="relative z-10 font-medium">{item.name}</span>
                        <ChevronDown className={`h-4 w-4 transition-all duration-300 ${isCategoriesOpen ? 'rotate-180' : ''} group-hover:text-neutral-900`} />
                        {/* Luxury Active indicator */}
                        {isActiveLink(item.href) && (
                          <motion.div
                            layoutId="activeTab"
                            className="absolute -bottom-2 left-0 right-0 h-0.5 bg-gradient-to-r from-neutral-900 to-neutral-700 rounded-full shadow-sm"
                            initial={false}
                            transition={{ type: "spring", stiffness: 400, damping: 25 }}
                          />
                        )}
                        {/* Luxury Hover indicator */}
                        <motion.div
                          className="absolute -bottom-2 left-0 right-0 h-0.5 bg-neutral-300 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                          initial={false}
                        />
                      </button>

                      {/* Luxury Categories Dropdown */}
                      <AnimatePresence>
                        {isCategoriesOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: 15, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 15, scale: 0.95 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                            className="absolute top-full left-0 mt-4 w-72 bg-white/95 backdrop-blur-xl border border-neutral-200/60 rounded-2xl shadow-2xl z-50 overflow-hidden"
                          >
                            <div className="p-3">
                              {item.dropdownItems?.map((dropdownItem, index) => (
                                <motion.div
                                  key={dropdownItem.name}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: index * 0.05 }}
                                >
                                  <Link
                                    to={dropdownItem.href}
                                    onClick={() => setIsCategoriesOpen(false)}
                                    className="group block px-5 py-4 text-neutral-700 hover:bg-neutral-50/80 rounded-xl transition-all duration-200 hover:shadow-sm"
                                  >
                                    <p className="font-semibold text-neutral-900 group-hover:text-neutral-900 tracking-wide">{dropdownItem.name}</p>
                                  </Link>
                                </motion.div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <Link
                      to={item.href}
                      className={`relative text-sm font-medium tracking-wide transition-all duration-300 py-3 px-1 group ${
                        isActiveLink(item.href)
                          ? 'text-neutral-900'
                          : 'text-neutral-600 hover:text-neutral-900'
                      }`}
                      aria-current={isActiveLink(item.href) ? 'page' : undefined}
                    >
                      <span className="relative z-10">{item.name}</span>
                      {/* Luxury Active indicator */}
                      {isActiveLink(item.href) && (
                        <motion.div
                          layoutId="activeTab"
                          className="absolute -bottom-2 left-0 right-0 h-0.5 bg-gradient-to-r from-neutral-900 to-neutral-700 rounded-full shadow-sm"
                          initial={false}
                          transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        />
                      )}
                      {/* Luxury Hover indicator */}
                      <motion.div
                        className="absolute -bottom-2 left-0 right-0 h-0.5 bg-neutral-300 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        initial={false}
                      />
                    </Link>
                  )}
                </div>
              ))}
            </nav>

            {/* Luxury Action Bar */}
            <div className="flex items-center space-x-1">
              {/* Luxury Search Button */}
              <Tooltip content="Search products" position="bottom">
                <motion.button
                  onClick={() => setIsSearchOpen(true)}
                  className="p-3 rounded-xl text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50/80 transition-all duration-300 group"
                  aria-label="Search products"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Search className="h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
                </motion.button>
              </Tooltip>

              {/* Luxury Wishlist */}
              <Tooltip content={`Wishlist (${wishlistItems.length} items)`} position="bottom">
                <Link to="/wishlist" className="relative group">
                  <motion.div
                    className="p-3 rounded-xl text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50/80 transition-all duration-300"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Heart className="h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
                  </motion.div>
                  {wishlistItems.length > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 h-5 w-5 text-xs rounded-full flex items-center justify-center font-medium bg-red-500 text-white shadow-lg"
                    >
                      {wishlistItems.length > 99 ? '99+' : wishlistItems.length}
                    </motion.span>
                  )}
                </Link>
              </Tooltip>

              {/* Luxury Cart */}
              <Tooltip content={`Shopping cart (${itemCount} items)`} position="bottom">
                <motion.button
                  onClick={onCartClick}
                  className="relative p-3 rounded-xl text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50/80 transition-all duration-300 group"
                  aria-label={`Shopping cart (${itemCount} items)`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <ShoppingCart className="h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
                  {itemCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 h-5 w-5 text-xs rounded-full flex items-center justify-center font-medium bg-neutral-900 text-white shadow-lg"
                    >
                      {itemCount > 99 ? '99+' : itemCount}
                    </motion.span>
                  )}
                </motion.button>
              </Tooltip>

              {/* Luxury Sell Button - Elevated CTA */}
              {user && (
                <Tooltip content="Start selling your products" position="bottom">
                  <Link to="/dashboard" className="ml-3">
                    <motion.div
                      className="px-5 py-2.5 bg-neutral-900 text-white rounded-xl font-medium text-sm tracking-wide hover:bg-neutral-800 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center space-x-2"
                      whileHover={{ scale: 1.02, y: -1 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Plus className="h-4 w-4" />
                      <span>Sell</span>
                    </motion.div>
                  </Link>
                </Tooltip>
              )}

              {user ? (
                <div className="relative ml-4">
                  <motion.button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center rounded-full ring-2 ring-transparent transition-all duration-300 hover:ring-neutral-300 hover:shadow-lg"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <img
                      src={user.avatar || `https://api.dicebear.com/8.x/initials/svg?seed=${user.name}`}
                      alt={user.name}
                      className="h-10 w-10 rounded-full border-2 border-neutral-200 bg-neutral-100 shadow-sm"
                    />
                  </motion.button>
                  <AnimatePresence>
                    {isUserMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="absolute right-0 mt-3 w-56 rounded-2xl shadow-2xl py-2 z-50 border bg-white/95 backdrop-blur-xl border-neutral-200/60 overflow-hidden"
                      >
                        <div className="px-5 py-4 border-b border-neutral-100/80">
                          <p className="text-sm font-semibold text-neutral-900 tracking-wide">{user.name}</p>
                          <p className="text-xs capitalize text-neutral-500 mt-1 font-medium">{user.role}</p>
                        </div>
                        <div className="py-2">
                          <Link
                            to="/profile"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center px-5 py-3 text-sm text-neutral-700 hover:bg-neutral-50/80 hover:text-neutral-900 transition-all duration-200 group"
                          >
                            <User className="h-4 w-4 mr-3 group-hover:scale-110 transition-transform duration-200" />
                            <span className="font-medium">Profile</span>
                          </Link>
                          <Link
                            to="/dashboard"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center px-5 py-3 text-sm text-neutral-700 hover:bg-neutral-50/80 hover:text-neutral-900 transition-all duration-200 group"
                          >
                            <Settings className="h-4 w-4 mr-3 group-hover:scale-110 transition-transform duration-200" />
                            <span className="font-medium">Dashboard</span>
                          </Link>
                          <Link
                            to="/orders"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center px-5 py-3 text-sm text-neutral-700 hover:bg-neutral-50/80 hover:text-neutral-900 transition-all duration-200 group"
                          >
                            <Package className="h-4 w-4 mr-3 group-hover:scale-110 transition-transform duration-200" />
                            <span className="font-medium">My Orders</span>
                          </Link>
                        </div>
                        <div className="border-t border-neutral-100/80 mt-2 pt-2">
                          <button
                            onClick={() => { logout(); setIsUserMenuOpen(false); }}
                            className="flex items-center w-full px-5 py-3 text-sm text-neutral-700 hover:bg-red-50/80 hover:text-red-600 transition-all duration-200 group"
                          >
                            <LogOut className="h-4 w-4 mr-3 group-hover:scale-110 transition-transform duration-200" />
                            <span className="font-medium">Sign Out</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <motion.button
                  onClick={onAuthClick}
                  className="ml-4 px-6 py-2.5 bg-neutral-900 text-white rounded-xl font-medium text-sm tracking-wide hover:bg-neutral-800 transition-all duration-300 shadow-lg hover:shadow-xl"
                  aria-label="Sign in to your account"
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Sign In
                </motion.button>
              )}

              {/* Luxury Mobile Menu Button */}
              <motion.button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="lg:hidden p-3 rounded-xl text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50/80 transition-all duration-300 ml-3"
                aria-label={isMenuOpen ? "Close menu" : "Open menu"}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <motion.div
                  animate={{ rotate: isMenuOpen ? 90 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </motion.div>
              </motion.button>
            </div>
          </div>

          {/* Enhanced Mobile Navigation */}
          {isMenuOpen && (
            <motion.div
              className="lg:hidden border-t border-neutral-100 bg-white"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
                <div className="py-4 space-y-1">
                  {navigationItems.map((item) => (
                    <div key={item.name}>
                      {item.hasDropdown ? (
                        <div>
                          <Link
                            to={item.href}
                            onClick={() => setIsMenuOpen(false)}
                            className={`block px-6 py-4 text-base font-medium transition-colors touch-manipulation ${
                              isActiveLink(item.href)
                                ? 'text-neutral-900 bg-neutral-50'
                                : 'text-neutral-600 hover:text-neutral-700 hover:bg-neutral-50 active:bg-neutral-100'
                            }`}
                            style={{ minHeight: '48px' }}
                          >
                            {item.name}
                          </Link>
                          {item.dropdownItems?.map((dropdownItem) => (
                            <Link
                              key={dropdownItem.name}
                              to={dropdownItem.href}
                              onClick={() => setIsMenuOpen(false)}
                              className="block px-10 py-3 text-sm transition-colors text-neutral-500 hover:text-neutral-700 touch-manipulation active:bg-neutral-50"
                              style={{ minHeight: '44px' }}
                            >
                              {dropdownItem.name}
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <Link
                          to={item.href}
                          onClick={() => setIsMenuOpen(false)}
                          className={`block px-6 py-4 text-base font-medium transition-colors touch-manipulation ${
                            isActiveLink(item.href)
                              ? 'text-neutral-900 bg-neutral-50'
                              : 'text-neutral-600 hover:text-neutral-700 hover:bg-neutral-50 active:bg-neutral-100'
                          }`}
                          style={{ minHeight: '48px' }}
                        >
                          {item.name}
                        </Link>
                      )}
                    </div>
                  ))}

                  {/* Mobile Action Items */}
                  <div className="px-6 pt-6 space-y-4 border-t border-neutral-100">
                    {/* Mobile Cart and Wishlist */}
                    <div className="flex space-x-3">
                      <MobileTouchButton
                        onClick={() => {
                          onCartClick();
                          setIsMenuOpen(false);
                        }}
                        variant="secondary"
                        size="comfortable"
                        icon={ShoppingCart}
                        ariaLabel={`Shopping cart (${itemCount} items)`}
                        className="flex-1"
                      >
                        Cart ({itemCount})
                      </MobileTouchButton>

                      <MobileIconButton
                        icon={Heart}
                        onClick={() => setIsMenuOpen(false)}
                        variant="secondary"
                        size="comfortable"
                        ariaLabel={`Wishlist (${wishlistItems.length} items)`}
                      />
                    </div>

                    {!user && (
                      <MobileTouchButton
                        onClick={() => {
                          onAuthClick();
                          setIsMenuOpen(false);
                        }}
                        variant="primary"
                        size="comfortable"
                        ariaLabel="Sign in to your account"
                        fullWidth
                      >
                        Sign In
                      </MobileTouchButton>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
        </div>
      </header>
      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
};
