import { useState, useCallback, useRef } from 'react';

// Touch gesture configuration
interface SwipeConfig {
  minSwipeDistance?: number;
  maxSwipeTime?: number;
  preventDefaultTouchmove?: boolean;
}

interface SwipeHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}

interface TouchPosition {
  x: number;
  y: number;
  time: number;
}

// Hook for swipe gesture detection
export const useSwipeGesture = (
  handlers: SwipeHandlers,
  config: SwipeConfig = {}
) => {
  const {
    minSwipeDistance = 50,
    maxSwipeTime = 300,
    preventDefaultTouchmove = true,
  } = config;

  const [touchStart, setTouchStart] = useState<TouchPosition | null>(null);
  const [touchEnd, setTouchEnd] = useState<TouchPosition | null>(null);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.targetTouches[0];
    setTouchEnd(null);
    setTouchStart({
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    });
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (preventDefaultTouchmove) {
      e.preventDefault();
    }
    const touch = e.targetTouches[0];
    setTouchEnd({
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    });
  }, [preventDefaultTouchmove]);

  const onTouchEnd = useCallback(() => {
    if (!touchStart || !touchEnd) return;

    const deltaX = touchStart.x - touchEnd.x;
    const deltaY = touchStart.y - touchEnd.y;
    const deltaTime = touchEnd.time - touchStart.time;

    // Check if swipe was fast enough
    if (deltaTime > maxSwipeTime) return;

    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    // Determine swipe direction
    if (absDeltaX > absDeltaY) {
      // Horizontal swipe
      if (absDeltaX > minSwipeDistance) {
        if (deltaX > 0) {
          handlers.onSwipeLeft?.();
        } else {
          handlers.onSwipeRight?.();
        }
      }
    } else {
      // Vertical swipe
      if (absDeltaY > minSwipeDistance) {
        if (deltaY > 0) {
          handlers.onSwipeUp?.();
        } else {
          handlers.onSwipeDown?.();
        }
      }
    }
  }, [touchStart, touchEnd, minSwipeDistance, maxSwipeTime, handlers]);

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  };
};

// Hook for long press detection
interface LongPressConfig {
  threshold?: number;
  onStart?: () => void;
  onFinish?: () => void;
  onCancel?: () => void;
}

export const useLongPress = (
  onLongPress: () => void,
  config: LongPressConfig = {}
) => {
  const { threshold = 500, onStart, onFinish, onCancel } = config;
  const isLongPressActive = useRef(false);
  const isPressed = useRef(false);
  const timerId = useRef<NodeJS.Timeout>();

  const start = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (isPressed.current) return;
    
    isPressed.current = true;
    onStart?.();

    timerId.current = setTimeout(() => {
      if (isPressed.current) {
        isLongPressActive.current = true;
        onLongPress();
        onFinish?.();
      }
    }, threshold);
  }, [onLongPress, threshold, onStart, onFinish]);

  const clear = useCallback((shouldTriggerOnCancel = true) => {
    if (timerId.current) {
      clearTimeout(timerId.current);
    }
    
    if (shouldTriggerOnCancel && isPressed.current && !isLongPressActive.current) {
      onCancel?.();
    }
    
    isLongPressActive.current = false;
    isPressed.current = false;
  }, [onCancel]);

  return {
    onMouseDown: start,
    onMouseUp: () => clear(true),
    onMouseLeave: () => clear(false),
    onTouchStart: start,
    onTouchEnd: () => clear(true),
  };
};

// Hook for pinch-to-zoom detection
interface PinchConfig {
  onPinchStart?: (scale: number) => void;
  onPinchMove?: (scale: number) => void;
  onPinchEnd?: (scale: number) => void;
}

export const usePinchZoom = (config: PinchConfig = {}) => {
  const [initialDistance, setInitialDistance] = useState<number | null>(null);
  const [currentScale, setCurrentScale] = useState(1);

  const getDistance = (touches: TouchList) => {
    const touch1 = touches[0];
    const touch2 = touches[1];
    return Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) +
      Math.pow(touch2.clientY - touch1.clientY, 2)
    );
  };

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const distance = getDistance(e.touches);
      setInitialDistance(distance);
      config.onPinchStart?.(1);
    }
  }, [config]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && initialDistance) {
      e.preventDefault();
      const distance = getDistance(e.touches);
      const scale = distance / initialDistance;
      setCurrentScale(scale);
      config.onPinchMove?.(scale);
    }
  }, [initialDistance, config]);

  const onTouchEnd = useCallback(() => {
    if (initialDistance) {
      config.onPinchEnd?.(currentScale);
      setInitialDistance(null);
      setCurrentScale(1);
    }
  }, [initialDistance, currentScale, config]);

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  };
};

// Hook for detecting mobile device and orientation
export const useMobileDetection = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');

  const checkMobile = useCallback(() => {
    const userAgent = navigator.userAgent;
    const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
    setIsMobile(mobileRegex.test(userAgent) || window.innerWidth <= 768);
  }, []);

  const checkOrientation = useCallback(() => {
    setOrientation(window.innerHeight > window.innerWidth ? 'portrait' : 'landscape');
  }, []);

  // Check on mount and window resize
  useState(() => {
    checkMobile();
    checkOrientation();

    const handleResize = () => {
      checkMobile();
      checkOrientation();
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  });

  return {
    isMobile,
    orientation,
    isPortrait: orientation === 'portrait',
    isLandscape: orientation === 'landscape',
  };
};

// Hook for mobile-specific viewport handling
export const useMobileViewport = () => {
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  useState(() => {
    const initialHeight = window.innerHeight;
    
    const handleResize = () => {
      const currentHeight = window.innerHeight;
      setViewportHeight(currentHeight);
      
      // Detect virtual keyboard (significant height reduction on mobile)
      const heightDifference = initialHeight - currentHeight;
      setIsKeyboardOpen(heightDifference > 150);
    };

    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  });

  return {
    viewportHeight,
    isKeyboardOpen,
  };
};
