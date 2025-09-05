// Utility for controlling log frequency in development
class LogThrottler {
  private lastLogs: Map<string, number> = new Map();
  private defaultInterval: number = 1000; // 1 second default

  // Log a message with throttling
  throttledLog(message: string, interval: number = this.defaultInterval): void {
    const now = Date.now();
    const lastLogTime = this.lastLogs.get(message) || 0;
    
    if (now - lastLogTime > interval) {
      console.log(message);
      this.lastLogs.set(message, now);
    }
  }

  // Log a message with a key-based throttling
  keyedLog(key: string, message: string, interval: number = this.defaultInterval): void {
    const now = Date.now();
    const lastLogTime = this.lastLogs.get(key) || 0;
    
    if (now - lastLogTime > interval) {
      console.log(message);
      this.lastLogs.set(key, now);
    }
  }

  // Special handling for Supabase auth logs
  authLog(message: string): void {
    // Throttle auth logs more aggressively
    this.keyedLog('supabase_auth', message, 5000); // At most once every 5 seconds
  }

  // Clear all log timestamps (useful for testing)
  clear(): void {
    this.lastLogs.clear();
  }
}

export const logThrottler = new LogThrottler();