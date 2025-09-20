import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Search, ShoppingCart, User, Menu, X, Heart, LogOut, Settings, Package,
  ChevronDown, Zap, RefreshCw, Sparkles
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';
import { SearchOverlay } from './SearchOverlay';

import MobileNavigation from './MobileNavigation';
import logo from '../../assets/images/optimized/logo-optimized.webp';

// Preload the logo image
const preloadImage = (src: string) => {
  const img = new Image();
  img.src = src;
};

// Convert to optimized image component with better loading strategy
const OptimizedLogo = React.memo(() => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [logoSrc, setLogoSrc] = useState('');
  
  useEffect(() => {
    preloadImage(logo);
    setLogoSrc(logo);
    setIsLoaded(true);
  }, []);

  if (!isLoaded) {
    return (
      <div className="w-10 h-10 flex items-center justify-center">
        <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
      </div>
    );
  }

  return (
    <img
      src={logoSrc}
      alt="S.Essences Logo" 
      width={40}
      height={40}
      loading="eager"
      decoding="async"
      className="object-contain w-10 h-10 transition-all duration-300 md:w-8 md:h-8"
    />
  );
});

interface HeaderProps {
  onAuthClick: () => void;
  onCartClick: () => void;
}

interface DropdownItem {
  name: string;
  href: string;
}

interface NavigationItem {
  name: string;
  href: string;
  hasDropdown?: boolean;
  dropdownItems?: DropdownItem[];
}

export const Header: React.FC<HeaderProps> = ({ onAuthClick, onCartClick }) => {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const { items: wishlistItems } = useWishlist();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);

  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  
  const categoriesDropdownRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);


  const navigationItems: NavigationItem[] = [
    { name: 'Home', href: '/' },
    {
      name: 'Collections',
      href: '/products',
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
    { name: 'New Arrivals', href: '/new-arrivals' },
    { name: 'Offers', href: '/deals' },
    { name: 'About', href: '/about' },
  ];

  const isActiveLink = (href: string) => {
    return location.pathname === href;
  };

  // Detect scroll position for floating header background
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsScrolled(scrollPosition > 50);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoriesDropdownRef.current && !categoriesDropdownRef.current.contains(event.target as Node)) {
        setIsCategoriesOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }

    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close menus on route change and escape key
  useEffect(() => {
    if (isUserMenuOpen) setIsUserMenuOpen(false);
    if (isCategoriesOpen) setIsCategoriesOpen(false);

    if (isSearchOpen) setIsSearchOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsUserMenuOpen(false);
        setIsCategoriesOpen(false);

        setIsSearchOpen(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  // Check if we're on homepage to determine initial transparency
  const isHomePage = location.pathname === '/';
  const headerClasses = `
    fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out
    ${isHomePage && !isScrolled 
      ? 'bg-transparent backdrop-blur-none shadow-none' 
      : 'bg-white/90 backdrop-blur-xl shadow-lg border-b border-white/20'
    }
  `;

  const containerClasses = `
    mx-auto px-4 sm:px-6 lg:px-8 transition-all duration-300
    ${isScrolled 
      ? 'max-w-6xl mt-4 mb-4 bg-white/90 backdrop-blur-2xl rounded-2xl shadow-xl border border-white/30' 
      : 'max-w-7xl'
    }
  `;

  return (
    <>
      <header className={headerClasses}>
        <div className={containerClasses}>
          <div className={`flex items-center justify-between transition-all duration-300 ${
            isScrolled ? 'h-14 py-2' : 'h-16 sm:h-18 py-2 sm:py-3'
          }`}>
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2 flex-shrink-0 group" onClick={() => window.scrollTo(0, 0)}>
              <OptimizedLogo />
              <span className={`font-bold tracking-tight transition-all duration-300 ${
                isScrolled 
                  ? 'text-gray-900 text-lg' 
                  : isHomePage && !isScrolled 
                    ? 'text-white text-xl drop-shadow-lg' 
                    : 'text-gray-900 text-xl'
              }`}>S.Essences</span>
            </Link>

            {/* Desktop Navigation - Centered (hidden on mobile, visible on tablet and desktop) */}
            <nav className="hidden md:flex items-center justify-center flex-1">
              <div className={`flex items-center transition-all duration-300 ${
                isScrolled ? 'space-x-6' : 'space-x-8'
              }`}>
                {navigationItems.map((item) => (
                  <div key={item.name} className="relative">
                    {item.hasDropdown ? (
                      <div className="relative" ref={categoriesDropdownRef}>
                        <button
                          onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
                          className={`flex items-center space-x-1 px-3 py-2 text-sm font-medium transition-all duration-200 rounded-lg ${
                            isActiveLink(item.href)
                              ? 'text-purple-600 bg-purple-50/50'
                              : isHomePage && !isScrolled
                                ? 'text-white hover:text-purple-200 hover:bg-white/10'
                                : 'text-gray-700 hover:text-purple-600 hover:bg-gray-50'
                          }`}
                        >
                          <span>{item.name}</span>
                          <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isCategoriesOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Simplified Dropdown without heavy animations */}
                        {isCategoriesOpen && (
                          <div className="absolute top-full left-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-2">
                            {item.dropdownItems?.map((dropdownItem) => (
                              <Link
                                key={dropdownItem.name}
                                to={dropdownItem.href}
                                onClick={() => {
                                  setIsCategoriesOpen(false);
                                  window.scrollTo(0, 0);
                                }}
                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-600"
                              >
                                {dropdownItem.name}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <Link
                        to={item.href}
                        onClick={() => window.scrollTo(0, 0)}
                        className={`px-3 py-2 text-sm font-medium transition-all duration-200 rounded-lg ${
                          isActiveLink(item.href)
                            ? 'text-purple-600 bg-purple-50/50'
                            : isHomePage && !isScrolled
                              ? 'text-white hover:text-purple-200 hover:bg-white/10'
                              : 'text-gray-700 hover:text-purple-600 hover:bg-gray-50'
                        }`}
                      >
                        {item.name}
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </nav>

            {/* Action Bar - Right Aligned */}
            <div className={`flex items-center transition-all duration-300 ${
              isScrolled ? 'space-x-2' : 'space-x-3'
            }`}>
              {/* Search Button */}
              <button
                onClick={() => setIsSearchOpen(true)}
                className={`p-2 transition-all duration-200 rounded-lg ${
                  isHomePage && !isScrolled
                    ? 'text-white/90 hover:text-white hover:bg-white/10'
                    : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
                }`}
                aria-label="Search"
              >
                <Search className="h-5 w-5" />
              </button>

              {/* Wishlist */}
              <Link to="/wishlist" className={`relative p-2 transition-all duration-200 rounded-lg ${
                isHomePage && !isScrolled
                  ? 'text-white/90 hover:text-white hover:bg-white/10'
                  : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
              }`}>
                <Heart className="h-5 w-5" />
                {wishlistItems.length > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 text-xs rounded-full flex items-center justify-center font-medium bg-purple-600 text-white shadow-sm">
                    {wishlistItems.length > 9 ? '9+' : wishlistItems.length}
                  </span>
                )}
              </Link>

              {/* Cart */}
              <button
                onClick={() => {
                  onCartClick();
                  window.scrollTo(0, 0);
                }}
                className={`relative p-2 transition-all duration-200 rounded-lg ${
                  isHomePage && !isScrolled
                    ? 'text-white/90 hover:text-white hover:bg-white/10'
                    : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
                }`}
                aria-label={`Shopping cart (${itemCount} items)`}
              >
                <ShoppingCart className="h-5 w-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 text-xs rounded-full flex items-center justify-center font-medium bg-purple-600 text-white shadow-sm">
                    {itemCount > 9 ? '9+' : itemCount}
                  </span>
                )}
              </button>

              {/* Get Started Button */}
              {user ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className={`flex items-center space-x-2 p-2 transition-all duration-200 rounded-lg ${
                      isHomePage && !isScrolled
                        ? 'text-white/90 hover:text-white hover:bg-white/10'
                        : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
                    }`}
                  >
                    <img
                      src={user.avatar || `https://api.dicebear.com/8.x/initials/svg?seed=${user.name}`}
                      alt={user.name}
                      className="h-8 w-8 rounded-full border-2 border-white/30 shadow-sm"
                    />
                  </button>
                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-2">
                      <div className="px-4 py-3 border-b border-gray-200">
                        <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                        <p className="text-xs text-gray-500 uppercase mt-1">{user.role}</p>

                      </div>
                      <div className="py-1">
                        <Link
                          to="/profile"
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            window.scrollTo(0, 0);
                          }}
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-600"
                        >
                          <User className="h-4 w-4 mr-3" />
                          <span>Profile</span>
                        </Link>
                        <Link
                          to="/dashboard"
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            window.scrollTo(0, 0);
                          }}
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-600"
                        >
                          <Settings className="h-4 w-4 mr-3" />
                          <span>Dashboard</span>
                        </Link>
                        <Link
                          to="/orders"
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            window.scrollTo(0, 0);
                          }}
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-600"
                        >
                          <Package className="h-4 w-4 mr-3" />
                          <span>My Orders</span>
                        </Link>
                      </div>
                      

                      
                      <div className="border-t border-gray-200 py-1">
                        <button
                          onClick={() => { 
                            logout(); 
                            setIsUserMenuOpen(false);
                            window.scrollTo(0, 0);
                          }}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600"
                        >
                          <LogOut className="h-4 w-4 mr-3" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => {
                    navigate('/auth');
                    window.scrollTo(0, 0);
                  }}
                  className={`px-6 py-2.5 text-sm font-semibold rounded-full transition-all duration-200 shadow-sm hover:shadow-md flex items-center space-x-2 ${
                    isHomePage && !isScrolled
                      ? 'bg-white/20 hover:bg-white/30 text-white border border-white/30'
                      : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl'
                  }`}
                  aria-label="Get Started"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Get Started</span>
                </button>
              )}

              {/* Mobile Menu Button - Visible only on mobile */}
              <button
                onClick={() => setIsMenuOpen(true)}
                className={`md:hidden p-2 transition-all duration-200 rounded-lg ${
                  isHomePage && !isScrolled
                    ? 'text-white/90 hover:text-white hover:bg-white/10'
                    : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
                }`}
                aria-label="Open menu"
              >
                <Menu className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      </header>
      
      {/* Mobile Navigation Component - Android app-like slide-in */}
      <MobileNavigation 
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)} 
        onCartClick={onCartClick}
      />
      
      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
};

export default Header;
