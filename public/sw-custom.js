// Custom Service Worker for Judge.ca
// Enhanced caching strategies and performance optimization

const CACHE_NAME = 'judge-ca-v1'
const RUNTIME_CACHE = 'judge-ca-runtime'
const STATIC_CACHE = 'judge-ca-static'
const IMAGE_CACHE = 'judge-ca-images'
const API_CACHE = 'judge-ca-api'

// Files to cache immediately
const PRECACHE_URLS = [
  '/',
  '/offline',
  '/manifest.json',
  '/_next/static/css/',
  '/_next/static/chunks/framework.js',
  '/_next/static/chunks/main.js',
  '/_next/static/chunks/pages/_app.js',
]

// Install event - cache essential resources
self.addEventListener('install', event => {
  console.log('[SW] Install event')
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('[SW] Precaching static resources')
        return cache.addAll(PRECACHE_URLS)
      })
      .then(() => self.skipWaiting())
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[SW] Activate event')
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => !isCurrentCache(cacheName))
            .map(cacheName => {
              console.log('[SW] Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            })
        )
      })
      .then(() => self.clients.claim())
  )
})

// Check if cache is current
function isCurrentCache(cacheName) {
  return [CACHE_NAME, RUNTIME_CACHE, STATIC_CACHE, IMAGE_CACHE, API_CACHE].includes(cacheName)
}

// Fetch event - implement caching strategies
self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)
  
  // Skip non-GET requests
  if (request.method !== 'GET') return
  
  // Skip Chrome extensions
  if (url.protocol === 'chrome-extension:') return
  
  // Skip different origins unless it's fonts or CDN
  if (url.origin !== self.location.origin && !isTrustedOrigin(url.origin)) return
  
  event.respondWith(handleRequest(request, url))
})

// Handle different request types with appropriate strategies
async function handleRequest(request, url) {
  // API requests - Network First with short cache
  if (url.pathname.startsWith('/api/')) {
    return handleAPIRequest(request)
  }
  
  // Static assets - Cache First
  if (isStaticAsset(url.pathname)) {
    return handleStaticAsset(request)
  }
  
  // Images - Cache First with long expiry
  if (isImage(url.pathname)) {
    return handleImage(request)
  }
  
  // Next.js pages and data - Stale While Revalidate
  if (url.pathname.startsWith('/_next/')) {
    return handleNextAsset(request)
  }
  
  // HTML pages - Network First with fallback
  return handleHTMLPage(request)
}

// API Request Strategy - Network First with 5 minute cache
async function handleAPIRequest(request) {
  const cache = await caches.open(API_CACHE)
  
  try {
    // Try network first
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      // Cache successful responses for 5 minutes
      const responseClone = networkResponse.clone()
      const headers = new Headers(responseClone.headers)
      headers.set('sw-cache-timestamp', Date.now().toString())
      
      const modifiedResponse = new Response(responseClone.body, {
        status: responseClone.status,
        statusText: responseClone.statusText,
        headers: headers
      })
      
      cache.put(request, modifiedResponse)
    }
    
    return networkResponse
  } catch (error) {
    // Network failed, try cache
    const cachedResponse = await cache.match(request)
    
    if (cachedResponse) {
      const timestamp = cachedResponse.headers.get('sw-cache-timestamp')
      const isExpired = timestamp && (Date.now() - parseInt(timestamp)) > 5 * 60 * 1000 // 5 minutes
      
      if (!isExpired) {
        return cachedResponse
      }
    }
    
    // Return offline page for failed API requests
    return new Response(
      JSON.stringify({ error: 'Network unavailable', offline: true }),
      { 
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}

// Static Asset Strategy - Cache First with long expiry
async function handleStaticAsset(request) {
  const cache = await caches.open(STATIC_CACHE)
  const cached = await cache.match(request)
  
  if (cached) {
    return cached
  }
  
  try {
    const response = await fetch(request)
    if (response.ok) {
      cache.put(request, response.clone())
    }
    return response
  } catch (error) {
    return new Response('Asset not available offline', { status: 503 })
  }
}

// Image Strategy - Cache First with compression
async function handleImage(request) {
  const cache = await caches.open(IMAGE_CACHE)
  const cached = await cache.match(request)
  
  if (cached) {
    return cached
  }
  
  try {
    const response = await fetch(request)
    if (response.ok) {
      // Cache images for 30 days
      const headers = new Headers(response.headers)
      headers.set('Cache-Control', 'public, max-age=2592000')
      
      const modifiedResponse = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: headers
      })
      
      cache.put(request, modifiedResponse.clone())
      return modifiedResponse
    }
    return response
  } catch (error) {
    // Return placeholder image
    return cache.match('/images/placeholder.jpg') || 
           new Response('Image not available offline', { status: 503 })
  }
}

// Next.js Asset Strategy - Stale While Revalidate
async function handleNextAsset(request) {
  const cache = await caches.open(RUNTIME_CACHE)
  const cached = await cache.match(request)
  
  // Return cached version immediately if available
  if (cached) {
    // Update in background
    fetch(request)
      .then(response => {
        if (response.ok) {
          cache.put(request, response.clone())
        }
      })
      .catch(() => {}) // Ignore network errors for background update
    
    return cached
  }
  
  // No cache, fetch from network
  try {
    const response = await fetch(request)
    if (response.ok) {
      cache.put(request, response.clone())
    }
    return response
  } catch (error) {
    return new Response('Asset not available offline', { status: 503 })
  }
}

// HTML Page Strategy - Network First with offline fallback
async function handleHTMLPage(request) {
  const cache = await caches.open(RUNTIME_CACHE)
  
  try {
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone())
      return networkResponse
    }
    
    // Bad response, try cache
    const cached = await cache.match(request)
    return cached || await cache.match('/offline')
  } catch (error) {
    // Network error, try cache
    const cached = await cache.match(request)
    if (cached) {
      return cached
    }
    
    // Return offline page
    return cache.match('/offline') || new Response(
      '<!DOCTYPE html><html><head><title>Offline</title></head><body><h1>You are offline</h1><p>Please check your internet connection.</p></body></html>',
      { headers: { 'Content-Type': 'text/html' } }
    )
  }
}

// Helper functions
function isStaticAsset(pathname) {
  return pathname.startsWith('/_next/static/') ||
         pathname.startsWith('/static/') ||
         pathname.endsWith('.js') ||
         pathname.endsWith('.css') ||
         pathname.endsWith('.woff') ||
         pathname.endsWith('.woff2') ||
         pathname.endsWith('.ttf') ||
         pathname.endsWith('.eot')
}

function isImage(pathname) {
  return pathname.match(/\.(jpg|jpeg|png|gif|webp|svg|ico)$/i)
}

function isTrustedOrigin(origin) {
  const trustedOrigins = [
    'https://fonts.googleapis.com',
    'https://fonts.gstatic.com',
    'https://cdn.judge.ca',
    'https://www.googletagmanager.com',
    'https://www.google-analytics.com'
  ]
  return trustedOrigins.includes(origin)
}

// Background sync for offline actions
self.addEventListener('sync', event => {
  console.log('[SW] Sync event:', event.tag)
  
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync())
  }
})

async function doBackgroundSync() {
  // Handle offline form submissions, analytics, etc.
  console.log('[SW] Performing background sync')
  
  try {
    // Get pending requests from IndexedDB
    const pendingRequests = await getPendingRequests()
    
    for (const request of pendingRequests) {
      try {
        await fetch(request)
        await removePendingRequest(request.id)
      } catch (error) {
        console.log('[SW] Failed to sync request:', error)
      }
    }
  } catch (error) {
    console.log('[SW] Background sync failed:', error)
  }
}

// Placeholder functions for IndexedDB operations
async function getPendingRequests() {
  // Implement IndexedDB retrieval
  return []
}

async function removePendingRequest(id) {
  // Implement IndexedDB removal
}

// Push notification handling
self.addEventListener('push', event => {
  console.log('[SW] Push event')
  
  const options = {
    body: event.data ? event.data.text() : 'New notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View Details',
        icon: '/icons/checkmark.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/xmark.png'
      }
    ]
  }
  
  event.waitUntil(
    self.registration.showNotification('Judge.ca', options)
  )
})

// Notification click handling
self.addEventListener('notificationclick', event => {
  console.log('[SW] Notification click:', event.action)
  
  event.notification.close()
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    )
  }
})

// Performance monitoring
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'PERFORMANCE_MEASURE') {
    console.log('[SW] Performance measure:', event.data.payload)
    // Forward to analytics
  }
})

console.log('[SW] Service Worker loaded')