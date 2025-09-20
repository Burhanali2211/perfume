// Simple Service Worker Manager
class ServiceWorkerManager {
  private registration: ServiceWorkerRegistration | null = null;

  async register(): Promise<ServiceWorkerRegistration | null> {
    if (!('serviceWorker' in navigator)) {
      return null;
    }

    try {
      this.registration = await navigator.serviceWorker.register('/sw.js');
      return this.registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  }

  async unregister(): Promise<boolean> {
    if (!this.registration) return false;
    return await this.registration.unregister();
  }

  isSupported(): boolean {
    return 'serviceWorker' in navigator;
  }
}

export const serviceWorkerManager = new ServiceWorkerManager();