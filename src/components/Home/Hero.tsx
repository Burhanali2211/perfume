import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Truck, ShieldCheck, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import heroBackground from '../../assets/images/homepage/hero-background.jpg';

export const Hero: React.FC = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize after component loads
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  return (
    <section 
      ref={containerRef}
      className="luxury-hero-section relative min-h-[80vh] sm:min-h-screen overflow-hidden flex items-center justify-center"
      role="banner"
      aria-label="Luxury Perfume Collection Hero"
    >
      {/* Sophisticated Full-Screen Background */}
      <div className="absolute inset-0">
        {/* Premium Perfume Bottle Composition Background */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105"
          style={{
            backgroundImage: `url('${heroBackground}')`
          }}
        />
        
        {/* Sophisticated Dark Gradient Overlay (25% opacity) */}
        <div className="absolute inset-0 luxury-hero-overlay" />
        
        {/* Premium Vignette Effect for Focus */}
        <div className="absolute inset-0 luxury-hero-vignette" />
        
        {/* Light Ray Effects */}
        <div className="absolute inset-0 luxury-light-rays" />
      </div>

      {/* Luxury Content Container */}
      <div className="relative z-10 luxury-hero-container w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          className="hero-content"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          aria-live="polite"
        >
          {/* Elegant Typography Section */}
          <h1 className="primary-headline mb-4 sm:mb-6 md:mb-8">
            <motion.span 
              className="headline-line-1 block text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2 sm:mb-3"
              style={{
                fontFamily: 'Poppins, sans-serif',
                letterSpacing: '-0.02em',
                lineHeight: '1.1',
                textShadow: '0 4px 20px rgba(0, 0, 0, 0.5)'
              }}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.3 }}
            >
              Discover Your Signature
            </motion.span>
            <motion.span 
              className="headline-line-2 block text-xl sm:text-2xl md:text-3xl lg:text-4xl font-light text-white/95"
              style={{
                fontFamily: 'Poppins, sans-serif',
                letterSpacing: '-0.01em',
                lineHeight: '1.2',
                textShadow: '0 4px 20px rgba(0, 0, 0, 0.5)'
              }}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.5 }}
            >
              Fragrance Journey
            </motion.span>
          </h1>

          <motion.p 
            className="hero-tagline text-sm sm:text-base md:text-lg text-white/90 font-light mb-6 sm:mb-8 md:mb-10 max-w-2xl mx-auto leading-relaxed px-3 sm:px-0"
            style={{
              fontFamily: 'Inter, sans-serif',
              letterSpacing: '0.02em',
              textShadow: '0 2px 10px rgba(0, 0, 0, 0.4)'
            }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.7 }}
          >
            Curated luxury fragrances from world's finest perfume houses
          </motion.p>

          {/* Sophisticated CTA Buttons */}
          <motion.nav 
            className="hero-actions flex flex-col sm:flex-row gap-2 sm:gap-3 md:gap-4 justify-center items-center mb-8 sm:mb-10 md:mb-12"
            aria-label="Primary Actions"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.9 }}
          >
            <Link to="/products" className="w-full sm:w-auto">
              <motion.button 
                className="primary-cta w-full sm:w-auto px-4 sm:px-5 py-2 sm:py-2.5 md:py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold text-sm sm:text-base rounded-full shadow-lg hover:shadow-xl active:from-purple-700 active:to-purple-800 touch-manipulation"
                style={{
                  fontFamily: 'Inter, sans-serif',
                  letterSpacing: '0.01em',
                  minWidth: '120px'
                }}
                whileHover={{ 
                  scale: 1.02,
                  boxShadow: '0 0 25px rgba(147, 51, 234, 0.5)',
                  transition: { duration: 0.2 }
                }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                Shop Collection
              </motion.button>
            </Link>
            
            <Link to="/products?category=fragrance-finder" className="w-full sm:w-auto">
              <motion.button 
                className="secondary-cta w-full sm:w-auto px-4 sm:px-5 py-2 sm:py-2.5 md:py-3 bg-white border-2 border-white text-white-700 font-semibold text-sm sm:text-base rounded-full shadow-lg hover:shadow-xl active:bg-gray-50 touch-manipulation"
                style={{
                  fontFamily: 'Inter, sans-serif',
                  letterSpacing: '0.01em',
                  minWidth: '120px'
                }}
                whileHover={{ 
                  scale: 1.02,
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  boxShadow: '0 0 25px rgba(255, 255, 255, 0.4)',
                  transition: { duration: 0.2 }
                }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                Find Your Scent
              </motion.button>
            </Link>
          </motion.nav>
        </motion.div>
      </div>

      {/* Premium Trust Indicators */}
      <motion.div 
        className="absolute bottom-4 sm:bottom-6 left-1/2 transform -translate-x-1/2 z-20 w-full max-w-2xl px-3 sm:px-4"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 1.1 }}
      >
        <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-4 md:space-x-6 text-white/90 text-xs sm:text-sm md:text-base backdrop-blur-sm bg-black/20 rounded-lg sm:rounded-xl py-2 sm:py-3 px-3 sm:px-4 md:px-6">
          <motion.div 
            className="flex items-center space-x-1.5 sm:space-x-2"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 1.3 }}
          >
            <Truck className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-yellow-400" />
            <span className="font-medium">Free Shipping</span>
          </motion.div>
          
          <motion.div 
            className="flex items-center space-x-1.5 sm:space-x-2"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.5 }}
          >
            <ShieldCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-yellow-400" />
            <span className="font-medium">Authentic Products</span>
          </motion.div>
          
          <motion.div 
            className="flex items-center space-x-1.5 sm:space-x-2"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 1.7 }}
          >
            <RefreshCw className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-yellow-400" />
            <span className="font-medium">30-Day Returns</span>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
};
