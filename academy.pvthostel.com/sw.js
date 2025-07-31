// Service Worker for PVT Ecosystem PWA
// Advanced caching, offline support, and push notifications

const CACHE_NAME = 'pvt-ecosystem-v1.0.0';
const STATIC_CACHE_NAME = 'pvt-static-v1.0.0';
const DYNAMIC_CACHE_NAME = 'pvt-dynamic-v1.0.0';

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/academy/',
  '/academy/index.html',
  '/automation/',
  '/automation/index.html',
  '/united/',
  '/united/index.html',
  '/css/main.css',
  '/css/footer.css',
  '/css/adaptive-ui-system.css',
  '/js/main.js',
  '/js/footer.js',
  '/js/ai-personalization.js',
  '/js/adaptive-ui-components.js',
  '/js/advanced-analytics.js',
  '/images/icons/icon-192x192.png',
  '/images/icons/icon-512x512.png',
  '/manifest.json',
  'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// Runtime caching strategies
const CACHE_STRATEGIES = {
  '/api/': 'NetworkFirst',
  '/images/': 'CacheFirst',
  '/css/': 'StaleWhileRevalidate',
  '/js/': 'StaleWhileRevalidate',
  '/academy/courses/': 'NetworkFirst',
  '/automation/projects/': 'NetworkFirst',
  '/united/properties/': 'NetworkFirst'
};

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('Service Worker: Static assets cached');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Failed to cache static assets', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE_NAME && 
                cacheName !== DYNAMIC_CACHE_NAME &&
                cacheName !== CACHE_NAME) {
              console.log('Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Claiming clients');
        return self.clients.claim();
      })
  );
});

// Fetch event - handle network requests
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
  
  // Apply caching strategy based on URL pattern
  const strategy = getCacheStrategy(url.pathname);
  
  event.respondWith(
    handleRequest(request, strategy)
  );
});

// Determine cache strategy based on URL
function getCacheStrategy(pathname) {
  for (const [pattern, strategy] of Object.entries(CACHE_STRATEGIES)) {
    if (pathname.startsWith(pattern)) {
      return strategy;
    }
  }
  return 'NetworkFirst'; // Default strategy
}

// Handle requests with appropriate caching strategy
async function handleRequest(request, strategy) {
  const cache = await caches.open(DYNAMIC_CACHE_NAME);
  
  switch (strategy) {
    case 'CacheFirst':
      return cacheFirst(request, cache);
    case 'NetworkFirst':
      return networkFirst(request, cache);
    case 'StaleWhileRevalidate':
      return staleWhileRevalidate(request, cache);
    default:
      return networkFirst(request, cache);
  }
}

// Cache First strategy
async function cacheFirst(request, cache) {
  try {
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('Cache First failed:', error);
    return getOfflineFallback(request);
  }
}

// Network First strategy
async function networkFirst(request, cache) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('Network failed, trying cache:', error);
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    return getOfflineFallback(request);
  }
}

// Stale While Revalidate strategy
async function staleWhileRevalidate(request, cache) {
  const cachedResponse = await cache.match(request);
  
  const networkResponsePromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch((error) => {
      console.log('Network update failed:', error);
      return cachedResponse;
    });
  
  return cachedResponse || networkResponsePromise;
}

// Get offline fallback
function getOfflineFallback(request) {
  const url = new URL(request.url);
  
  // Return offline page for HTML requests
  if (request.headers.get('accept').includes('text/html')) {
    return caches.match('/offline.html') || 
           new Response('<h1>Offline</h1><p>Please check your internet connection.</p>', {
             headers: { 'Content-Type': 'text/html' }
           });
  }
  
  // Return offline image for image requests
  if (request.headers.get('accept').includes('image')) {
    return caches.match('/images/offline.png') ||
           new Response('', { status: 204 });
  }
  
  // Return empty response for other requests
  return new Response('', { status: 204 });
}

// Background sync for analytics
self.addEventListener('sync', (event) => {
  if (event.tag === 'analytics-sync') {
    event.waitUntil(syncAnalytics());
  }
  
  if (event.tag === 'course-progress-sync') {
    event.waitUntil(syncCourseProgress());
  }
});

// Sync analytics data
async function syncAnalytics() {
  try {
    const cache = await caches.open('analytics-cache');
    const requests = await cache.keys();
    
    for (const request of requests) {
      const response = await cache.match(request);
      const data = await response.json();
      
      try {
        await fetch('/api/analytics/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        
        // Remove from cache after successful sync
        await cache.delete(request);
      } catch (error) {
        console.error('Failed to sync analytics:', error);
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Sync course progress
async function syncCourseProgress() {
  try {
    const cache = await caches.open('course-progress-cache');
    const requests = await cache.keys();
    
    for (const request of requests) {
      const response = await cache.match(request);
      const data = await response.json();
      
      try {
        await fetch('/api/academy/progress/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        
        await cache.delete(request);
      } catch (error) {
        console.error('Failed to sync course progress:', error);
      }
    }
  } catch (error) {
    console.error('Course progress sync failed:', error);
  }
}

// Push notifications
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/images/icons/icon-192x192.png',
    badge: '/images/icons/badge-72x72.png',
    image: data.image,
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: data.primaryKey,
      url: data.url
    },
    actions: [
      {
        action: 'explore',
        title: 'Explore',
        icon: '/images/icons/explore-icon.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/images/icons/close-icon.png'
      }
    ],
    tag: data.tag || 'default',
    renotify: true,
    requireInteraction: data.requireInteraction || false
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'close') {
    return;
  }
  
  const url = event.notification.data.url || '/';
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window' })
      .then((clients) => {
        // Check if there's already a window open
        for (const client of clients) {
          if (client.url === url && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Open new window
        if (self.clients.openWindow) {
          return self.clients.openWindow(url);
        }
      })
  );
});

// Periodic background sync
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'course-reminder') {
    event.waitUntil(sendCourseReminder());
  }
  
  if (event.tag === 'analytics-cleanup') {
    event.waitUntil(cleanupAnalytics());
  }
});

// Send course reminder
async function sendCourseReminder() {
  try {
    const response = await fetch('/api/academy/reminder-check');
    const data = await response.json();
    
    if (data.showReminder) {
      await self.registration.showNotification('Continue Your Learning', {
        body: 'You have unfinished courses in PVT Academy',
        icon: '/images/icons/icon-192x192.png',
        badge: '/images/icons/badge-72x72.png',
        tag: 'course-reminder',
        data: { url: '/academy/dashboard' }
      });
    }
  } catch (error) {
    console.error('Failed to send course reminder:', error);
  }
}

// Cleanup analytics
async function cleanupAnalytics() {
  try {
    const cache = await caches.open('analytics-cache');
    const requests = await cache.keys();
    const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    
    for (const request of requests) {
      const response = await cache.match(request);
      const data = await response.json();
      
      if (data.timestamp < oneWeekAgo) {
        await cache.delete(request);
      }
    }
  } catch (error) {
    console.error('Analytics cleanup failed:', error);
  }
}

// Share target handler
self.addEventListener('fetch', (event) => {
  if (event.request.url.endsWith('/share') && event.request.method === 'POST') {
    event.respondWith(handleShareTarget(event.request));
  }
});

// Handle share target
async function handleShareTarget(request) {
  try {
    const formData = await request.formData();
    const title = formData.get('title');
    const text = formData.get('text');
    const url = formData.get('url');
    const files = formData.getAll('files');
    
    // Process shared content
    const shareData = {
      title,
      text,
      url,
      files: files.map(file => ({
        name: file.name,
        type: file.type,
        size: file.size
      }))
    };
    
    // Store in cache for processing
    const cache = await caches.open('share-cache');
    await cache.put(
      new Request('/share-data'),
      new Response(JSON.stringify(shareData))
    );
    
    // Return response
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Share target failed:', error);
    return new Response(JSON.stringify({ error: 'Share failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Message handler for client communication
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_ANALYTICS') {
    cacheAnalyticsData(event.data.data);
  }
  
  if (event.data && event.data.type === 'CACHE_COURSE_PROGRESS') {
    cacheCourseProgress(event.data.data);
  }
});

// Cache analytics data for background sync
async function cacheAnalyticsData(data) {
  try {
    const cache = await caches.open('analytics-cache');
    await cache.put(
      new Request(`/analytics-${Date.now()}`),
      new Response(JSON.stringify(data))
    );
  } catch (error) {
    console.error('Failed to cache analytics data:', error);
  }
}

// Cache course progress for background sync
async function cacheCourseProgress(data) {
  try {
    const cache = await caches.open('course-progress-cache');
    await cache.put(
      new Request(`/course-progress-${Date.now()}`),
      new Response(JSON.stringify(data))
    );
  } catch (error) {
    console.error('Failed to cache course progress:', error);
  }
}

console.log('Service Worker loaded successfully');
console.log('Cache version:', CACHE_NAME);
console.log('Static assets to cache:', STATIC_ASSETS.length);