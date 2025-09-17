/**
 * Network Error Handler
 * Handles common network errors and provides fallbacks
 */

export class NetworkErrorHandler {
  private static instance: NetworkErrorHandler;
  private errorLog: Array<{ timestamp: Date; error: string; url?: string }> = [];

  private constructor() {
    this.setupGlobalErrorHandlers();
  }

  public static getInstance(): NetworkErrorHandler {
    if (!NetworkErrorHandler.instance) {
      NetworkErrorHandler.instance = new NetworkErrorHandler();
    }
    return NetworkErrorHandler.instance;
  }

  private setupGlobalErrorHandlers(): void {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      if (this.isNetworkError(event.reason)) {
        this.logError('Unhandled network rejection', event.reason?.message);
        event.preventDefault(); // Prevent console error
      }
    });

    // Handle resource loading errors
    window.addEventListener('error', (event) => {
      if (event.target && event.target !== window) {
        const target = event.target as HTMLElement;
        if (target.tagName === 'LINK' || target.tagName === 'SCRIPT' || target.tagName === 'IMG') {
          this.handleResourceError(target);
        }
      }
    }, true);
  }

  private isNetworkError(error: any): boolean {
    if (!error) return false;
    
    const networkErrorMessages = [
      'Failed to fetch',
      'ERR_BLOCKED_BY_CLIENT',
      'ERR_NETWORK',
      'ERR_INTERNET_DISCONNECTED',
      'TypeError: Failed to fetch'
    ];

    const errorMessage = error.message || error.toString();
    return networkErrorMessages.some(msg => errorMessage.includes(msg));
  }

  private handleResourceError(element: HTMLElement): void {
    const url = (element as any).src || (element as any).href;
    this.logError('Resource loading failed', `Failed to load: ${url}`);

    // Handle specific resource types
    if (element.tagName === 'LINK' && (element as HTMLLinkElement).rel === 'stylesheet') {
      this.handleStylesheetError(element as HTMLLinkElement);
    } else if (element.tagName === 'SCRIPT') {
      this.handleScriptError(element as HTMLScriptElement);
    }
  }

  private handleStylesheetError(link: HTMLLinkElement): void {
    // For external stylesheets, we can provide fallbacks or ignore gracefully
    if (link.href.includes('googleapis.com')) {
      console.warn('Google Fonts blocked - using system fonts as fallback');
    }
  }

  private handleScriptError(script: HTMLScriptElement): void {
    // Handle analytics or other third-party script failures
    if (script.src.includes('google-analytics') || script.src.includes('gtag')) {
      console.warn('Analytics script blocked - continuing without tracking');
    }
  }

  private logError(type: string, message: string, url?: string): void {
    const errorEntry = {
      timestamp: new Date(),
      error: `${type}: ${message}`,
      url
    };
    
    this.errorLog.push(errorEntry);
    
    // Keep only last 50 errors to prevent memory leaks
    if (this.errorLog.length > 50) {
      this.errorLog.shift();
    }

    // Only log to console in development
    if (import.meta.env.DEV) {
      console.warn(errorEntry.error);
    }
  }

  public getErrorLog(): Array<{ timestamp: Date; error: string; url?: string }> {
    return [...this.errorLog];
  }

  public clearErrorLog(): void {
    this.errorLog = [];
  }

  // Utility method to wrap fetch calls with error handling
  public async safeFetch(url: string, options?: RequestInit): Promise<Response | null> {
    try {
      const response = await fetch(url, options);
      return response;
    } catch (error) {
      if (this.isNetworkError(error)) {
        this.logError('Fetch failed', `Network error for ${url}`, url);
        return null;
      }
      throw error; // Re-throw non-network errors
    }
  }
}

// Initialize the error handler
export const networkErrorHandler = NetworkErrorHandler.getInstance();

// Export a utility function for safe fetch
export const safeFetch = (url: string, options?: RequestInit) => 
  networkErrorHandler.safeFetch(url, options);
