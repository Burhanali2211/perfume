const CACHE_NAME = 'ecommerce-v3';
const RUNTIME_CACHE = 'runtime-cache-v3';
const IMAGE_CACHE = 'image-cache-v3';
const API_CACHE = 'api-cache-v3';
const FONT_CACHE = 'font-cache-v3';

// Check if we're in development mode
const isDevelopment = location.hostname === 'localhost' || location.hostname === '127.0.0.1';

// Assets to cache on install - optimized for faster installation
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/offline.html'
];

// Network-first strategies for these patterns
const NETWORK_FIRST_PATTERNS = [
  /\/api\//,
  /\/auth\//,
  /\/checkout\//,
  /\/orders\//
];

// Cache-first strategies for these patterns
const CACHE_FIRST_PATTERNS = [
  /\.(css|js|woff2|woff|ttf|eot)$/,
  /\/assets\//,
  /\/static\//
];

// Stale-while-revalidate patterns
const STALE_WHILE_REVALIDATE_PATTERNS = [
  /\/products\//,
  /\/categories\//,
  /\/search\//
];

// Image patterns
const IMAGE_PATTERNS = [
  /\.(png|jpg|jpeg|svg|gif|webp|avif)$/i
];

// Font patterns
const FONT_PATTERNS = [
  /\.(woff2|woff|ttf|eot)$/i
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Install event');
  
  // Skip caching in development mode to avoid conflicts with HMR
  if (isDevelopment) {
    console.log('[SW] Skipping cache in development mode');
    return;
  }
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Static assets cached successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Failed to cache static assets:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activate event');
  
  // Skip cleanup in development mode
  if (isDevelopment) {
    console.log('[SW] Skipping cache cleanup in development mode');
    event.waitUntil(self.clients.claim());
    return;
  }
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              return cacheName !== CACHE_NAME && 
                     cacheName !== RUNTIME_CACHE && 
                     cacheName !== IMAGE_CACHE &&
                     cacheName !== API_CACHE &&
                     cacheName !== FONT_CACHE;
            })
            .map((cacheName) => {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('[SW] Old caches cleaned up');
        return self.clients.claim();
      })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension requests
  if (url.protocol === 'chrome-extension:') {
    return;
  }
  
  // Skip WebSocket upgrade requests
  if (request.headers.get('upgrade') === 'websocket') {
    return;
  }
  
  // Skip service worker in development mode to avoid conflicts with HMR
  if (isDevelopment) {
    // Only handle specific requests in development
    if (url.pathname === '/offline.html' || url.pathname === '/manifest.json') {
      event.respondWith(handleRequest(request));
    }
    return;
  }
  
  event.respondWith(handleRequest(request));
});

// Message event - handle communication from the app
self.addEventListener('message', (event) => {
  const { type, payload } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
    case 'CLEAR_CACHE':
      clearAllCaches().then(() => {
        event.ports[0].postMessage({ success: true });
      });
      break;
      
    case 'CACHE_STATS':
      getCacheStats().then((stats) => {
        event.ports[0].postMessage({ stats });
      });
      break;
      
    case 'PREFETCH_RESOURCES':
      prefetchResources(payload.urls).then(() => {
        event.ports[0].postMessage({ success: true });
      });
      break;
      
    default:
      console.warn('[SW] Unknown message type:', type);
  }
});

async function handleRequest(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  
  // Skip handling for module scripts in development
  if (isDevelopment && request.destination === 'script' && pathname.endsWith('.tsx')) {
    return fetch(request);
  }
  
  try {
    // Font caching strategy - cache-first with long TTL
    if (isFontRequest(pathname)) {
      return await handleFontRequest(request);
    }
    
    // Image caching strategy
    if (isImageRequest(pathname)) {
      return await handleImageRequest(request);
    }
    
    // Audio/Video caching strategy
    if (request.destination === 'audio' || request.destination === 'video') {
      // For media files, use network-first strategy with fallback
      try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
          return networkResponse;
        }
      } catch (error) {
        console.warn('[SW] Media fetch failed, serving fallback:', error);
        // Return a simple response for media errors
        return new Response('', { status: 204 }); // No content
      }
    }
    
    // API caching strategy
    if (isApiRequest(pathname)) {
      return await handleApiRequest(request);
    }
    
    // Static asset caching strategy
    if (isStaticAsset(pathname)) {
      return await handleStaticAssetRequest(request);
    }
    
    // Stale-while-revalidate strategy
    if (isStaleWhileRevalidateRequest(pathname)) {
      return await handleStaleWhileRevalidate(request);
    }
    
    // Network-first strategy
    if (isNetworkFirstRequest(pathname)) {
      return await handleNetworkFirst(request);
    }
    
    // Default: Network-first for navigation requests
    if (request.destination === 'document') {
      return await handleNetworkFirst(request);
    }
    
    // Cache-first for other requests
    return await handleCacheFirst(request);
    
  } catch (error) {
    console.error('[SW] Request handling error:', error);
    
    // Return offline page for navigation requests
    if (request.destination === 'document') {
      return await getOfflinePage();
    }
    
    // For other requests, try to return a basic response
    return new Response('Service Unavailable', { status: 503 });
  }
}

// Font caching with long TTL
async function handleFontRequest(request) {
  const cache = await caches.open(FONT_CACHE);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache fonts for 1 year
      const responseToCache = networkResponse.clone();
      responseToCache.headers.append('Cache-Control', 'public, max-age=31536000, immutable');
      cache.put(request, responseToCache);
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[SW] Font fetch failed:', error);
    throw error;
  }
}

// Image caching with size limits
async function handleImageRequest(request) {
  const cache = await caches.open(IMAGE_CACHE);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    // Update cache in background if image is old
    updateImageCacheInBackground(request, cache);
    return cachedResponse;
  }
  
  try {
    // Add CORS mode to fetch
    const networkResponse = await fetch(request, {
      mode: 'cors',
      credentials: 'omit'
    });
    
    if (networkResponse.ok) {
      // Only cache images smaller than 2MB
      const contentLength = networkResponse.headers.get('content-length');
      if (!contentLength || parseInt(contentLength) < 2 * 1024 * 1024) {
        cache.put(request, networkResponse.clone());
        
        // Manage cache size
        manageImageCacheSize();
      }
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[SW] Image fetch failed:', error);
    // For image requests, return a transparent 1x1 pixel GIF as fallback
    return cachedResponse || new Response(
      'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 
      {
        headers: { 'Content-Type': 'image/gif' },
        status: 200
      }
    );
  }
}

// API caching with TTL
async function handleApiRequest(request) {
  const cache = await caches.open(API_CACHE);
  
  try {
    // Add CORS mode to fetch
    const networkResponse = await fetch(request, {
      mode: 'cors',
      credentials: 'omit',
      timeout: 5000 // 5 second timeout
    });
    
    if (networkResponse.ok) {
      // Cache API responses for 1 minute
      const responseToCache = networkResponse.clone();
      responseToCache.headers.append('sw-cached-at', Date.now().toString());
      cache.put(request, responseToCache);
      
      // Clean old API cache entries
      cleanApiCache(cache);
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[SW] API fetch failed:', error);
    
    // Try to serve from cache
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      // Check if cache is still valid (1 minute)
      const cachedAt = cachedResponse.headers.get('sw-cached-at');
      if (cachedAt && Date.now() - parseInt(cachedAt) < 1 * 60 * 1000) {
        return cachedResponse;
      }
    }
    
    throw error;
  }
}

// Static asset caching (cache-first)
async function handleStaticAssetRequest(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[SW] Static asset fetch failed:', error);
    throw error;
  }
}

// Stale-while-revalidate strategy
async function handleStaleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cachedResponse = await cache.match(request);
  
  // Always try to update cache in background
  const networkResponsePromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch((error) => {
      console.warn('[SW] Background update failed:', error);
    });
  
  // Return cached version immediately if available
  if (cachedResponse) {
    // Don't wait for network update
    networkResponsePromise.catch(() => {});
    return cachedResponse;
  }
  
  // If no cache, wait for network
  try {
    return await networkResponsePromise;
  } catch (error) {
    console.error('[SW] Stale-while-revalidate failed:', error);
    throw error;
  }
}

// Network-first strategy
async function handleNetworkFirst(request) {
  try {
    const networkResponse = await fetch(request, { timeout: 3000 });
    
    if (networkResponse.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[SW] Network-first fetch failed:', error);
    
    const cache = await caches.open(RUNTIME_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    throw error;
  }
}

// Cache-first strategy
async function handleCacheFirst(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[SW] Cache-first fetch failed:', error);
    
    if (request.destination === 'document') {
      return await getOfflinePage();
    }
    
    throw error;
  }
}

// Utility functions
function isFontRequest(pathname) {
  return FONT_PATTERNS.some(pattern => pattern.test(pathname));
}

function isImageRequest(pathname) {
  return IMAGE_PATTERNS.some(pattern => pattern.test(pathname));
}

function isApiRequest(pathname) {
  return NETWORK_FIRST_PATTERNS.some(pattern => pattern.test(pathname));
}

function isStaticAsset(pathname) {
  return CACHE_FIRST_PATTERNS.some(pattern => pattern.test(pathname));
}

function isStaleWhileRevalidateRequest(pathname) {
  return STALE_WHILE_REVALIDATE_PATTERNS.some(pattern => pattern.test(pathname));
}

function isNetworkFirstRequest(pathname) {
  return NETWORK_FIRST_PATTERNS.some(pattern => pattern.test(pathname));
}

async function getOfflinePage() {
  const cache = await caches.open(CACHE_NAME);
  return await cache.match('/offline.html') || createErrorResponse('Offline');
}

function createErrorResponse(message) {
  return new Response(
    `<!DOCTYPE html>
    <html>
      <head><title>Error</title></head>
      <body>
        <h1>${message}</h1>
        <p>Please check your internet connection and try again.</p>
      </body>
    </html>`,
    {
      status: 200,
      headers: { 'Content-Type': 'text/html' }
    }
  );
}

// Background tasks
async function updateImageCacheInBackground(request, cache) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      await cache.put(request, networkResponse);
    }
  } catch (error) {
    console.warn('[SW] Background image update failed:', error);
  }
}

async function manageImageCacheSize() {
  const cache = await caches.open(IMAGE_CACHE);
  const keys = await cache.keys();
  
  // Remove old entries if cache is too large (50 images max)
  if (keys.length > 50) {
    const keysToDelete = keys.slice(0, keys.length - 50);
    await Promise.all(keysToDelete.map(key => cache.delete(key)));
    console.log(`[SW] Cleaned ${keysToDelete.length} old images from cache`);
  }
}

async function cleanApiCache(cache) {
  const keys = await cache.keys();
  const now = Date.now();
  const maxAge = 1 * 60 * 1000; // 1 minute
  
  for (const key of keys) {
    const response = await cache.match(key);
    if (response) {
      const cachedAt = response.headers.get('sw-cached-at');
      if (cachedAt && now - parseInt(cachedAt) > maxAge) {
        await cache.delete(key);
      }
    }
  }
}

async function clearAllCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map(name => caches.delete(name)));
  console.log('[SW] All caches cleared');
}

async function getCacheStats() {
  const cacheNames = [CACHE_NAME, RUNTIME_CACHE, IMAGE_CACHE, API_CACHE, FONT_CACHE];
  const stats = {};
  
  for (const cacheName of cacheNames) {
    try {
      const cache = await caches.open(cacheName);
      const keys = await cache.keys();
      stats[cacheName] = {
        entryCount: keys.length,
        exists: true
      };
    } catch (error) {
      stats[cacheName] = {
        entryCount: 0,
        exists: false,
        error: error.message
      };
    }
  }
  
  return stats;
}

async function prefetchResources(urls) {
  const cache = await caches.open(RUNTIME_CACHE);
  
  const fetchPromises = urls.map(async (url) => {
    try {
      const response = await fetch(url);
      if (response.ok) {
        await cache.put(url, response);
        console.log(`[SW] Prefetched: ${url}`);
      }
    } catch (error) {
      console.warn(`[SW] Prefetch failed for ${url}:`, error);
    }
  });
  
  await Promise.allSettled(fetchPromises);
}

console.log('[SW] Service Worker initialized successfully');