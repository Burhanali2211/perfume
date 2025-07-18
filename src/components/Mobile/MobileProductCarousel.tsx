import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Product } from '../../types/product';
import { MobileProductCard } from './MobileProductCard';
import { MobileIconButton } from './MobileTouchButton';
import { useSwipeGesture } from '../../hooks/useMobileGestures';

interface MobileProductCarouselProps {
  products: Product[];
  title?: string;
  variant?: 'default' | 'compact' | 'featured';
  itemsPerView?: number;
  showNavigation?: boolean;
  autoPlay?: boolean;
  autoPlayInterval?: number;
}

export const MobileProductCarousel: React.FC<MobileProductCarouselProps> = ({
  products,
  title,
  variant = 'default',
  itemsPerView = 1.2, // Show partial next item to indicate scrollability
  showNavigation = true,
  autoPlay = false,
  autoPlayInterval = 5000,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(autoPlay);
  const carouselRef = useRef<HTMLDivElement>(null);
  const autoPlayRef = useRef<NodeJS.Timeout>();

  const maxIndex = Math.max(0, products.length - Math.floor(itemsPerView));

  // Auto-play functionality
  useEffect(() => {
    if (isAutoPlaying && products.length > 1) {
      autoPlayRef.current = setInterval(() => {
        setCurrentIndex(prev => (prev >= maxIndex ? 0 : prev + 1));
      }, autoPlayInterval);
    }

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [isAutoPlaying, maxIndex, autoPlayInterval, products.length]);

  // Pause auto-play on user interaction
  const pauseAutoPlay = () => {
    setIsAutoPlaying(false);
    if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current);
    }
  };

  const goToNext = () => {
    pauseAutoPlay();
    setCurrentIndex(prev => Math.min(prev + 1, maxIndex));
  };

  const goToPrevious = () => {
    pauseAutoPlay();
    setCurrentIndex(prev => Math.max(prev - 1, 0));
  };

  const goToSlide = (index: number) => {
    pauseAutoPlay();
    setCurrentIndex(Math.min(Math.max(index, 0), maxIndex));
  };

  // Swipe gesture support
  const { onTouchStart, onTouchMove, onTouchEnd } = useSwipeGesture({
    onSwipeLeft: goToNext,
    onSwipeRight: goToPrevious,
  }, {
    minSwipeDistance: 50,
    preventDefaultTouchmove: false, // Allow scrolling
  });

  if (!products.length) {
    return null;
  }

  const itemWidth = 100 / itemsPerView;
  const translateX = -(currentIndex * itemWidth);

  return (
    <div className="w-full">
      {/* Title */}
      {title && (
        <div className="flex items-center justify-between mb-4 px-4">
          <h2 className="text-xl font-semibold text-neutral-900">{title}</h2>
          {showNavigation && products.length > itemsPerView && (
            <div className="flex space-x-2">
              <MobileIconButton
                icon={ChevronLeft}
                onClick={goToPrevious}
                disabled={currentIndex === 0}
                variant="secondary"
                size="minimum"
                ariaLabel="Previous products"
              />
              <MobileIconButton
                icon={ChevronRight}
                onClick={goToNext}
                disabled={currentIndex >= maxIndex}
                variant="secondary"
                size="minimum"
                ariaLabel="Next products"
              />
            </div>
          )}
        </div>
      )}

      {/* Carousel Container */}
      <div className="relative overflow-hidden">
        <div
          ref={carouselRef}
          className="flex transition-transform duration-300 ease-out"
          style={{ 
            transform: `translateX(${translateX}%)`,
            width: `${(products.length / itemsPerView) * 100}%`
          }}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {products.map((product, index) => (
            <div
              key={product.id}
              className="flex-shrink-0 px-2"
              style={{ width: `${itemWidth}%` }}
            >
              <MobileProductCard product={product} variant={variant} />
            </div>
          ))}
        </div>

        {/* Navigation Overlay for larger carousels */}
        {showNavigation && products.length > itemsPerView && (
          <>
            {currentIndex > 0 && (
              <button
                onClick={goToPrevious}
                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg z-10"
                aria-label="Previous products"
              >
                <ChevronLeft className="w-5 h-5 text-neutral-700" />
              </button>
            )}
            
            {currentIndex < maxIndex && (
              <button
                onClick={goToNext}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg z-10"
                aria-label="Next products"
              >
                <ChevronRight className="w-5 h-5 text-neutral-700" />
              </button>
            )}
          </>
        )}
      </div>

      {/* Indicators */}
      {products.length > itemsPerView && (
        <div className="flex justify-center mt-4 space-x-2">
          {Array.from({ length: maxIndex + 1 }, (_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                index === currentIndex 
                  ? 'bg-neutral-900' 
                  : 'bg-neutral-300 hover:bg-neutral-400'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Specialized carousel for featured products
export const MobileFeaturedCarousel: React.FC<{
  products: Product[];
  title?: string;
}> = ({ products, title }) => {
  return (
    <MobileProductCarousel
      products={products}
      title={title}
      variant="featured"
      itemsPerView={1}
      showNavigation={true}
      autoPlay={true}
      autoPlayInterval={4000}
    />
  );
};

// Specialized carousel for compact product lists
export const MobileCompactCarousel: React.FC<{
  products: Product[];
  title?: string;
}> = ({ products, title }) => {
  return (
    <MobileProductCarousel
      products={products}
      title={title}
      variant="compact"
      itemsPerView={1.5}
      showNavigation={false}
      autoPlay={false}
    />
  );
};

// Grid layout for mobile product listings
interface MobileProductGridProps {
  products: Product[];
  columns?: 1 | 2;
  variant?: 'default' | 'compact';
}

export const MobileProductGrid: React.FC<MobileProductGridProps> = ({
  products,
  columns = 2,
  variant = 'default',
}) => {
  const gridCols = columns === 1 ? 'grid-cols-1' : 'grid-cols-2';
  const gap = variant === 'compact' ? 'gap-3' : 'gap-4';

  return (
    <div className={`grid ${gridCols} ${gap} p-4`}>
      {products.map((product) => (
        <MobileProductCard
          key={product.id}
          product={product}
          variant={variant}
        />
      ))}
    </div>
  );
};
