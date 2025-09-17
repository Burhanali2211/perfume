/**
 * Console Error Suppression
 * Suppresses known harmless console errors to reduce noise
 */

interface ErrorPattern {
  pattern: RegExp;
  description: string;
  suppress: boolean;
}

class ConsoleErrorSuppressor {
  private static instance: ConsoleErrorSuppressor;
  private originalConsoleError: typeof console.error;
  private originalConsoleWarn: typeof console.warn;
  private suppressedErrors: ErrorPattern[] = [
    {
      pattern: /ERR_BLOCKED_BY_CLIENT/,
      description: 'Ad blocker blocking resources',
      suppress: true
    },
    {
      pattern: /google-analytics\.com.*Failed to load resource/,
      description: 'Google Analytics blocked by ad blocker',
      suppress: true
    },
    {
      pattern: /googleapis\.com.*Failed to load resource/,
      description: 'Google Fonts blocked by ad blocker',
      suppress: true
    },
    {
      pattern: /preloaded using link preload but not used/,
      description: 'Preload resource timing warning',
      suppress: true
    },
    {
      pattern: /contentScript\.bundle\.js.*Failed to fetch/,
      description: 'Browser extension script error',
      suppress: true
    },
    {
      pattern: /i18next: languageChanged/,
      description: 'Browser extension i18n messages',
      suppress: true
    },
    {
      pattern: /i18next: initialized/,
      description: 'Browser extension i18n initialization',
      suppress: true
    }
  ];

  private constructor() {
    this.originalConsoleError = console.error;
    this.originalConsoleWarn = console.warn;
    this.setupErrorSuppression();
  }

  public static getInstance(): ConsoleErrorSuppressor {
    if (!ConsoleErrorSuppressor.instance) {
      ConsoleErrorSuppressor.instance = new ConsoleErrorSuppressor();
    }
    return ConsoleErrorSuppressor.instance;
  }

  private setupErrorSuppression(): void {
    // Only suppress in production to avoid hiding real development issues
    if (import.meta.env.PROD) {
      console.error = (...args: any[]) => {
        if (!this.shouldSuppressMessage(args)) {
          this.originalConsoleError.apply(console, args);
        }
      };

      console.warn = (...args: any[]) => {
        if (!this.shouldSuppressMessage(args)) {
          this.originalConsoleWarn.apply(console, args);
        }
      };
    }
  }

  private shouldSuppressMessage(args: any[]): boolean {
    const message = args.join(' ');
    
    return this.suppressedErrors.some(errorPattern => {
      if (errorPattern.suppress && errorPattern.pattern.test(message)) {
        // Log suppressed errors in development for debugging
        if (import.meta.env.DEV) {
          console.debug(`Suppressed: ${errorPattern.description}`, message);
        }
        return true;
      }
      return false;
    });
  }

  public addSuppressionPattern(pattern: RegExp, description: string): void {
    this.suppressedErrors.push({
      pattern,
      description,
      suppress: true
    });
  }

  public removeSuppressionPattern(pattern: RegExp): void {
    this.suppressedErrors = this.suppressedErrors.filter(
      error => error.pattern.source !== pattern.source
    );
  }

  public getSuppressionPatterns(): ErrorPattern[] {
    return [...this.suppressedErrors];
  }

  public restore(): void {
    console.error = this.originalConsoleError;
    console.warn = this.originalConsoleWarn;
  }
}

// Initialize the suppressor
export const consoleErrorSuppressor = ConsoleErrorSuppressor.getInstance();

// Export for manual control if needed
export { ConsoleErrorSuppressor };
