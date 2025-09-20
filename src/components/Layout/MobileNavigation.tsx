import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  X, Home, Package, Star, Tag, User, ShoppingCart, Heart, 
  ChevronRight, LogOut, Settings, Package as PackageIcon
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';

import { useSwipeGesture } from '../../hooks/useMobileGestures';

interface MobileNavigationProps {
  isOpen: boolean;
  onClose: () => void;
  onCartClick: () => void;
}

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  hasDropdown?: boolean;
  dropdownItems?: {
    name: string;
    href: string;
  }[];
}

const MobileNavigation: React.FC<MobileNavigationProps> = ({ 
  isOpen, 
  onClose, 
  onCartClick 
}) => {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const { items: wishlistItems } = useWishlist();
  const location = useLocation();
  const navigate = useNavigate();
  const navRef = useRef<HTMLDivElement>(null);
  
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  
  // Navigation items with icons for mobile
  const navigationItems: NavigationItem[] = [
    { name: 'Home', href: '/', icon: <Home className="h-5 w-5" /> },
    {
      name: 'Collections',
      href: '/products',
      icon: <Package className="h-5 w-5" />,
      hasDropdown: true,
      dropdownItems: [
        { name: 'All Products', href: '/products' },
        { name: 'Oudh Attars', href: '/categories/oudh-attars' },
        { name: 'Floral Attars', href: '/categories/floral-attars' },
        { name: 'Musk Attars', href: '/categories/musk-attars' },
        { name: 'Amber Attars', href: '/categories/amber-attars' },
        { name: 'Saffron Attars', href: '/categories/saffron-attars' },
        { name: 'Sandalwood Attars', href: '/categories/sandalwood-attars' },
        { name: 'Jasmine Attars', href: '/categories/jasmine-attars' },
        { name: 'Attar Blends', href: '/categories/attar-blends' },
        { name: 'Seasonal Attars', href: '/categories/seasonal-attars' },
        { name: 'Heritage Attars', href: '/categories/heritage-attars' },
      ]
    },
    { name: 'New Arrivals', href: '/new-arrivals', icon: <Star className="h-5 w-5" /> },
    { name: 'Offers', href: '/deals', icon: <Tag className="h-5 w-5" /> },
    { name: 'About', href: '/about', icon: <User className="h-5 w-5" /> },
  ];

  // Handle swipe to close
  const { bindGestures } = useSwipeGesture({
    onSwipeLeft: () => onClose(),
  });

  // Close dropdown when route changes
  useEffect(() => {
    onClose();
    setActiveDropdown(null);
  }, [location.pathname, onClose]);

  // Bind swipe gestures to navigation panel
  useEffect(() => {
    if (navRef.current && isOpen) {
      bindGestures(navRef.current);
    }
  }, [isOpen, bindGestures]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const isActiveLink = (href: string) => {
    return location.pathname === href;
  };

  const toggleDropdown = (itemName: string) => {
    setActiveDropdown(activeDropdown === itemName ? null : itemName);
  };

  // Focus management for accessibility
  useEffect(() => {
    if (isOpen && navRef.current) {
      // Focus the first focusable element when menu opens
      const firstFocusable = navRef.current.querySelector('button, a, input') as HTMLElement;
      if (firstFocusable) {
        firstFocusable.focus();
      }
    }
  }, [isOpen]);

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 md:hidden"
          onClick={onClose}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              onClose();
            }
          }}
          aria-label="Close navigation menu"
        />
      )}

      {/* Mobile Navigation Panel - Android-like slide-in from left */}
      <div
        ref={navRef}
        className={`fixed top-0 left-0 h-full w-80 max-w-[90vw] bg-white z-50 shadow-2xl transform transition-transform duration-300 ease-out md:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="mobile-nav-title"
        aria-hidden={!isOpen}
      >
        {/* Header with close button */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 id="mobile-nav-title" className="text-lg font-semibold text-gray-900">
            Menu
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
            aria-label="Close menu"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* User Section */}
        <div className="p-4 border-b border-gray-200">
          {user ? (
            <div className="flex items-center space-x-3">
              <img
                src={user.avatar || `https://api.dicebear.com/8.x/initials/svg?seed=${user.name}`}
                alt={user.name}
                className="h-12 w-12 rounded-full border-2 border-purple-200"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                <p className="text-xs text-gray-500 uppercase">{user.role}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                <User className="h-6 w-6 text-gray-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Guest</p>
                <button
                  onClick={() => {
                    navigate('/auth');
                    onClose();
                  }}
                  className="text-xs text-purple-600 font-medium hover:text-purple-700 focus:outline-none focus:underline"
                >
                  Sign in
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-2 p-4 border-b border-gray-200">
          <Link
            to="/wishlist"
            onClick={onClose}
            className="flex flex-col items-center p-3 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <div className="relative">
              <Heart className="h-6 w-6 text-gray-600" />
              {wishlistItems.length > 0 && (
                <span className="absolute -top-2 -right-2 h-5 w-5 text-xs rounded-full flex items-center justify-center font-medium bg-purple-600 text-white">
                  {wishlistItems.length > 9 ? '9+' : wishlistItems.length}
                </span>
              )}
            </div>
            <span className="text-xs mt-1 text-gray-600">Wishlist</span>
          </Link>
          
          <button
            onClick={() => {
              onCartClick();
              onClose();
            }}
            className="flex flex-col items-center p-3 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <div className="relative">
              <ShoppingCart className="h-6 w-6 text-gray-600" />
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 h-5 w-5 text-xs rounded-full flex items-center justify-center font-medium bg-purple-600 text-white">
                  {itemCount > 9 ? '9+' : itemCount}
                </span>
              )}
            </div>
            <span className="text-xs mt-1 text-gray-600">Cart</span>
          </button>
          
          {user ? (
            <Link
              to="/profile"
              onClick={onClose}
              className="flex flex-col items-center p-3 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <User className="h-6 w-6 text-gray-600" />
              <span className="text-xs mt-1 text-gray-600">Profile</span>
            </Link>
          ) : (
            <button
              onClick={() => {
                navigate('/auth');
                onClose();
              }}
              className="flex flex-col items-center p-3 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <User className="h-6 w-6 text-gray-600" />
              <span className="text-xs mt-1 text-gray-600">Account</span>
            </button>
          )}
        </div>

        {/* Navigation Menu */}
        <div className="flex-1 overflow-y-auto">
          <nav className="py-2">
            {navigationItems.map((item) => (
              <div key={item.name}>
                {item.hasDropdown ? (
                  <>
                    <button
                      onClick={() => toggleDropdown(item.name)}
                      className={`w-full flex items-center justify-between px-4 py-3 text-base font-medium ${
                        isActiveLink(item.href)
                          ? 'text-purple-600 bg-purple-50'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                      aria-expanded={activeDropdown === item.name}
                    >
                      <div className="flex items-center">
                        <span className="mr-3 text-gray-500">{item.icon}</span>
                        <span>{item.name}</span>
                      </div>
                      <ChevronRight 
                        className={`h-5 w-5 text-gray-400 transition-transform ${
                          activeDropdown === item.name ? 'rotate-90' : ''
                        }`} 
                      />
                    </button>
                    
                    {activeDropdown === item.name && (
                      <div className="bg-gray-50" role="region" aria-label={`${item.name} submenu`}>
                        {item.dropdownItems?.map((dropdownItem) => (
                          <Link
                            key={dropdownItem.name}
                            to={dropdownItem.href}
                            onClick={onClose}
                            className={`block px-12 py-3 text-sm ${
                              isActiveLink(dropdownItem.href)
                                ? 'text-purple-600 bg-purple-50'
                                : 'text-gray-600 hover:bg-gray-100'
                            }`}
                          >
                            {dropdownItem.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <Link
                    to={item.href}
                    onClick={onClose}
                    className={`flex items-center px-4 py-3 text-base font-medium ${
                      isActiveLink(item.href)
                        ? 'text-purple-600 bg-purple-50'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className="mr-3 text-gray-500">{item.icon}</span>
                    <span>{item.name}</span>
                  </Link>
                )}
              </div>
            ))}
          </nav>
        </div>

        {/* User Actions */}
        {user && (
          <div className="border-t border-gray-200 py-2">
            <Link
              to="/dashboard"
              onClick={onClose}
              className="flex items-center px-4 py-3 text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <Settings className="h-5 w-5 text-gray-500 mr-3" />
              <span>Dashboard</span>
            </Link>
            
            <Link
              to="/orders"
              onClick={onClose}
              className="flex items-center px-4 py-3 text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <PackageIcon className="h-5 w-5 text-gray-500 mr-3" />
              <span>My Orders</span>
            </Link>
            

            
            <button
              onClick={() => { 
                logout(); 
                onClose();
              }}
              className="flex items-center w-full px-4 py-3 text-base font-medium text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <LogOut className="h-5 w-5 text-red-500 mr-3" />
              <span>Sign Out</span>
            </button>
          </div>
        )}


      </div>
    </>
  );
};

export default MobileNavigation;