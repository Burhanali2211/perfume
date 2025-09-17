/**
 * Utility functions to prevent XrayWrapper cross-origin errors in Firefox
 * These errors occur when trying to modify objects from different security contexts
 */

// Check if we're in Firefox and if XrayWrapper errors might occur
export const isFirefox = (): boolean => {
  return typeof window !== 'undefined' && navigator.userAgent.includes('Firefox');
};

// Check if an object is wrapped (potential XrayWrapper)
export const isWrappedObject = (obj: any): boolean => {
  if (typeof obj !== 'object' || obj === null) return false;
  
  try {
    // Try to access a property - if it throws, it might be wrapped
    const keys = Object.keys(obj);
    return false;
  } catch (error) {
    // If we get an error accessing properties, it might be wrapped
    return true;
  }
};

// Safely set properties on potentially wrapped objects
export const safeSetProperty = (obj: any, key: string, value: any): boolean => {
  try {
    // First try direct assignment
    obj[key] = value;
    return true;
  } catch (error) {
    // If direct assignment fails, try using wrappedJSObject (Firefox)
    if (isFirefox() && obj.wrappedJSObject) {
      try {
        obj.wrappedJSObject[key] = value;
        return true;
      } catch (wrappedError) {
        console.warn('Failed to set property even with wrappedJSObject:', wrappedError);
      }
    }
    
    console.warn(`XrayWrapper: Failed to set property '${key}' on object:`, error);
    return false;
  }
};

// Safely get properties from potentially wrapped objects
export const safeGetProperty = (obj: any, key: string): any => {
  try {
    return obj[key];
  } catch (error) {
    // If direct access fails, try using wrappedJSObject (Firefox)
    if (isFirefox() && obj.wrappedJSObject) {
      try {
        return obj.wrappedJSObject[key];
      } catch (wrappedError) {
        console.warn('Failed to get property even with wrappedJSObject:', wrappedError);
      }
    }
    
    console.warn(`XrayWrapper: Failed to get property '${key}' from object:`, error);
    return undefined;
  }
};

// Safely clone objects to avoid cross-origin issues
export const safeClone = (obj: any): any => {
  try {
    // Try JSON clone first (works for simple objects)
    return JSON.parse(JSON.stringify(obj));
  } catch (error) {
    try {
      // If JSON fails, try structured clone
      if (typeof structuredClone !== 'undefined') {
        return structuredClone(obj);
      }
    } catch (cloneError) {
      console.warn('XrayWrapper: Failed to clone object:', cloneError);
    }
    
    // Fallback to shallow copy
    if (typeof obj === 'object' && obj !== null) {
      return Array.isArray(obj) ? [...obj] : { ...obj };
    }
    
    return obj;
  }
};

// Safely dispatch events to avoid cross-origin issues
export const safeDispatchEvent = (target: EventTarget, event: Event): boolean => {
  try {
    return target.dispatchEvent(event);
  } catch (error) {
    // If direct dispatch fails, try using wrappedJSObject (Firefox)
    if (isFirefox() && (target as any).wrappedJSObject) {
      try {
        return (target as any).wrappedJSObject.dispatchEvent(event);
      } catch (wrappedError) {
        console.warn('Failed to dispatch event even with wrappedJSObject:', wrappedError);
      }
    }
    
    console.warn('XrayWrapper: Failed to dispatch event:', error);
    return false;
  }
};

// Safely post messages to avoid cross-origin issues
export const safePostMessage = (target: Window | Worker | MessagePort, message: any, targetOrigin?: string): void => {
  try {
    if ('postMessage' in target) {
      if (targetOrigin) {
        (target as Window).postMessage(message, targetOrigin);
      } else {
        target.postMessage(message);
      }
    }
  } catch (error) {
    // If direct postMessage fails, try using wrappedJSObject (Firefox)
    if (isFirefox() && (target as any).wrappedJSObject) {
      try {
        if (targetOrigin) {
          (target as any).wrappedJSObject.postMessage(message, targetOrigin);
        } else {
          (target as any).wrappedJSObject.postMessage(message);
        }
      } catch (wrappedError) {
        console.warn('Failed to post message even with wrappedJSObject:', wrappedError);
      }
    } else {
      console.warn('XrayWrapper: Failed to post message:', error);
    }
  }
};

// Wrap fetch requests to handle cross-origin issues
export const safeFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  try {
    // Ensure CORS settings are explicit
    const safeInit: RequestInit = {
      mode: 'cors',
      credentials: 'omit',
      ...init
    };
    
    return await fetch(input, safeInit);
  } catch (error) {
    console.warn('XrayWrapper: Fetch failed:', error);
    throw error;
  }
};

// Safely handle localStorage/sessionStorage access
export const safeStorageAccess = {
  setItem: (storage: Storage, key: string, value: string): boolean => {
    try {
      storage.setItem(key, value);
      return true;
    } catch (error) {
      console.warn('XrayWrapper: Failed to set storage item:', error);
      return false;
    }
  },
  
  getItem: (storage: Storage, key: string): string | null => {
    try {
      return storage.getItem(key);
    } catch (error) {
      console.warn('XrayWrapper: Failed to get storage item:', error);
      return null;
    }
  },
  
  removeItem: (storage: Storage, key: string): boolean => {
    try {
      storage.removeItem(key);
      return true;
    } catch (error) {
      console.warn('XrayWrapper: Failed to remove storage item:', error);
      return false;
    }
  }
};

// Initialize XrayWrapper fixes
export const initXrayWrapperFixes = (): void => {
  if (!isFirefox()) {
    return; // Only needed for Firefox
  }
  
  console.log('🔧 Initializing XrayWrapper fixes for Firefox');
  
  // Override console methods to prevent XrayWrapper issues
  const originalConsole = { ...console };
  
  ['log', 'warn', 'error', 'info', 'debug'].forEach((method, index) => {
    (console as any)[method] = (...args: any[]) => {
      try {
        // Use a more type-safe approach to call the original console method
        const consoleMethod = originalConsole[method as keyof typeof originalConsole];
        if (typeof consoleMethod === 'function') {
          (consoleMethod as Function).apply(originalConsole, args);
        }
      } catch (error) {
        // Fallback to basic logging if XrayWrapper blocks console
        if (typeof window !== 'undefined' && (window as any).wrappedJSObject) {
          try {
            const wrappedConsoleMethod = (window as any).wrappedJSObject.console[method];
            if (typeof wrappedConsoleMethod === 'function') {
              wrappedConsoleMethod.apply((window as any).wrappedJSObject.console, args);
            }
          } catch (wrappedError) {
            // Silent fallback
          }
        }
      }
    };
  });
  
  // Listen for XrayWrapper errors and handle them gracefully
  window.addEventListener('error', (event) => {
    if (event.error?.message?.includes('XrayWrapper') || 
        event.error?.message?.includes('cross-origin object')) {
      console.warn('XrayWrapper error intercepted:', event.error);
      event.preventDefault();
      return false;
    }
  });
  
  console.log('✅ XrayWrapper fixes initialized');
};

// Export a comprehensive fix object
export const xrayWrapperFix = {
  isFirefox,
  isWrappedObject,
  safeSetProperty,
  safeGetProperty,
  safeClone,
  safeDispatchEvent,
  safePostMessage,
  safeFetch,
  safeStorageAccess,
  initXrayWrapperFixes
};

export default xrayWrapperFix;