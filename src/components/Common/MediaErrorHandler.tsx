import React, { useState, useRef, useEffect } from 'react';
import { AlertTriangle, RefreshCw, Image as ImageIcon } from 'lucide-react';

interface MediaErrorHandlerProps {
  src: string;
  alt: string;
  fallbackSrc?: string;
  className?: string;
  width?: number;
  height?: number;
  onError?: (error: Event) => void;
  onLoad?: () => void;
  retryAttempts?: number;
  placeholder?: React.ReactNode;
}

/**
 * Enhanced image component with error handling and retry logic
 */
export const SafeImage: React.FC<MediaErrorHandlerProps> = ({
  src,
  alt,
  fallbackSrc,
  className = '',
  width,
  height,
  onError,
  onLoad,
  retryAttempts = 2,
  placeholder
}) => {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [attempts, setAttempts] = useState(0);
  const imgRef = useRef<HTMLImageElement>(null);

  const handleError = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.warn(`Image load failed: ${currentSrc}`);
    
    if (onError) {
      onError(event.nativeEvent);
    }

    // Try fallback or retry
    if (attempts < retryAttempts) {
      setAttempts(prev => prev + 1);
      // Add cache busting parameter for retry
      const separator = currentSrc.includes('?') ? '&' : '?';
      setCurrentSrc(`${currentSrc}${separator}retry=${attempts + 1}`);
    } else if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
      setAttempts(0);
    } else {
      setHasError(true);
      setIsLoading(false);
    }
  };

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
    if (onLoad) {
      onLoad();
    }
  };

  const handleRetry = () => {
    setHasError(false);
    setIsLoading(true);
    setAttempts(0);
    setCurrentSrc(src);
  };

  // Reset when src changes
  useEffect(() => {
    setCurrentSrc(src);
    setHasError(false);
    setIsLoading(true);
    setAttempts(0);
  }, [src]);

  if (hasError) {
    return (
      <div 
        className={`flex flex-col items-center justify-center bg-gray-100 border border-gray-200 rounded ${className}`}
        style={{ width, height: height || 'auto', minHeight: height ? `${height}px` : '100px' }}
      >
        <AlertTriangle className="h-8 w-8 text-gray-400 mb-2" />
        <p className="text-sm text-gray-500 text-center mb-2">Failed to load image</p>
        <button
          onClick={handleRetry}
          className="flex items-center px-3 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded transition-colors"
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      {isLoading && placeholder && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded">
          {placeholder}
        </div>
      )}
      <img
        ref={imgRef}
        src={currentSrc}
        alt={alt}
        width={width}
        height={height}
        className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        onError={handleError}
        onLoad={handleLoad}
        loading="lazy"
        decoding="async"
        crossOrigin="anonymous"
        style={{
          ...(width && height && {
            aspectRatio: `${width} / ${height}`
          })
        }}
      />
    </div>
  );
};

/**
 * Default placeholder component
 */
export const ImagePlaceholder: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  return (
    <div className="flex items-center justify-center">
      <ImageIcon className={`${sizeClasses[size]} text-gray-400 animate-pulse`} />
    </div>
  );
};

/**
 * Video component with error handling
 */
interface SafeVideoProps {
  src: string;
  poster?: string;
  className?: string;
  width?: number;
  height?: number;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  controls?: boolean;
  onError?: (error: Event) => void;
  onLoad?: () => void;
}

export const SafeVideo: React.FC<SafeVideoProps> = ({
  src,
  poster,
  className = '',
  width,
  height,
  autoPlay = false,
  muted = true,
  loop = false,
  controls = true,
  onError,
  onLoad
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleError = (event: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    console.warn(`Video load failed: ${src}`);
    setHasError(true);
    setIsLoading(false);
    
    if (onError) {
      onError(event.nativeEvent);
    }
  };

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
    if (onLoad) {
      onLoad();
    }
  };

  if (hasError) {
    return (
      <div 
        className={`flex flex-col items-center justify-center bg-gray-100 border border-gray-200 rounded ${className}`}
        style={{ width, height: height || 'auto', minHeight: '200px' }}
      >
        <AlertTriangle className="h-12 w-12 text-gray-400 mb-2" />
        <p className="text-sm text-gray-500 text-center">Video unavailable</p>
      </div>
    );
  }

  return (
    <video
      src={src}
      poster={poster}
      width={width}
      height={height}
      className={className}
      autoPlay={autoPlay}
      muted={muted}
      loop={loop}
      controls={controls}
      onError={handleError}
      onLoadedData={handleLoad}
      preload="metadata"
      crossOrigin="anonymous"
    />
  );
};

/**
 * Global media error handler for unhandled media errors
 */
export const GlobalMediaErrorHandler: React.FC = () => {
  useEffect(() => {
    const handleGlobalMediaError = (event: Event) => {
      const target = event.target as HTMLMediaElement;
      if (target && (target.tagName === 'IMG' || target.tagName === 'VIDEO' || target.tagName === 'AUDIO')) {
        console.warn('Global media error caught:', {
          src: target.src || (target as HTMLImageElement).src,
          tagName: target.tagName,
          error: target.error
        });
        
        // Prevent the error from bubbling up and causing console errors
        event.preventDefault();
        event.stopPropagation();
      }
    };

    // Listen for media errors globally
    document.addEventListener('error', handleGlobalMediaError, true);

    return () => {
      document.removeEventListener('error', handleGlobalMediaError, true);
    };
  }, []);

  return null;
};
