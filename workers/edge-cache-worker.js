/**
 * Cloudflare Worker for Edge Caching and Performance Optimization
 * Handles intelligent caching, request optimization, and performance monitoring
 */

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  const cache = caches.default
  
  // Performance monitoring headers
  const startTime = Date.now()
  
  // Cache key with geo and device type
  const cacheKey = getCacheKey(request, url)
  
  // Check cache first
  let response = await cache.match(cacheKey)
  
  if (response) {
    // Cache hit - add performance headers
    response = new Response(response.body, response)
    response.headers.set('CF-Cache-Status', 'HIT')
    response.headers.set('CF-Response-Time', Date.now() - startTime)
    return response
  }
  
  // Cache miss - fetch from origin
  response = await fetch(request)
  
  // Clone response for caching
  const responseClone = response.clone()
  
  // Apply caching rules
  if (shouldCache(url, response)) {
    const cachedResponse = await optimizeResponse(responseClone, request)
    
    // Cache with appropriate TTL
    const ttl = getCacheTTL(url)
    const cacheHeaders = new Headers(cachedResponse.headers)
    cacheHeaders.set('Cache-Control', `public, max-age=${ttl}`)
    cacheHeaders.set('CF-Cache-Status', 'MISS')
    cacheHeaders.set('CF-Response-Time', Date.now() - startTime)
    
    const finalResponse = new Response(cachedResponse.body, {
      status: cachedResponse.status,
      statusText: cachedResponse.statusText,
      headers: cacheHeaders
    })
    
    // Store in cache
    event.waitUntil(cache.put(cacheKey, finalResponse.clone()))
    
    return finalResponse
  }
  
  // Don't cache, but add performance headers
  const headers = new Headers(response.headers)
  headers.set('CF-Cache-Status', 'BYPASS')
  headers.set('CF-Response-Time', Date.now() - startTime)
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: headers
  })
}

function getCacheKey(request, url) {
  const country = request.cf?.country || 'US'
  const deviceType = getDeviceType(request.headers.get('User-Agent'))
  const acceptWebP = request.headers.get('Accept')?.includes('image/webp')
  
  return `${url.href}:${country}:${deviceType}:${acceptWebP}`
}

function getDeviceType(userAgent) {
  if (!userAgent) return 'desktop'
  
  const mobile = /Mobile|Android|iPhone|iPad/i.test(userAgent)
  const tablet = /iPad|Tablet/i.test(userAgent)
  
  if (tablet) return 'tablet'
  if (mobile) return 'mobile'
  return 'desktop'
}

function shouldCache(url, response) {
  // Don't cache API routes
  if (url.pathname.startsWith('/api/')) return false
  
  // Don't cache non-successful responses
  if (response.status >= 400) return false
  
  // Don't cache dynamic routes with query params (except static assets)
  if (url.search && !url.pathname.startsWith('/_next/static/')) return false
  
  // Cache static assets
  if (url.pathname.startsWith('/_next/static/')) return true
  if (url.pathname.startsWith('/static/')) return true
  if (url.pathname.startsWith('/images/')) return true
  
  // Cache HTML pages
  const contentType = response.headers.get('content-type') || ''
  if (contentType.includes('text/html')) return true
  
  return false
}

function getCacheTTL(url) {
  // Long cache for static assets
  if (url.pathname.startsWith('/_next/static/')) return 31536000 // 1 year
  if (url.pathname.startsWith('/static/')) return 2592000 // 30 days
  if (url.pathname.startsWith('/images/')) return 2592000 // 30 days
  
  // Shorter cache for HTML pages
  return 3600 // 1 hour
}

async function optimizeResponse(response, request) {
  const contentType = response.headers.get('content-type') || ''
  
  // Image optimization
  if (contentType.startsWith('image/')) {
    return await optimizeImage(response, request)
  }
  
  // HTML optimization
  if (contentType.includes('text/html')) {
    return await optimizeHTML(response)
  }
  
  // CSS/JS minification (if not already minified)
  if (contentType.includes('text/css') || contentType.includes('application/javascript')) {
    return await minifyAsset(response, contentType)
  }
  
  return response
}

async function optimizeImage(response, request) {
  const acceptWebP = request.headers.get('Accept')?.includes('image/webp')
  const userAgent = request.headers.get('User-Agent') || ''
  const deviceType = getDeviceType(userAgent)
  
  // For now, return original response
  // In production, you'd integrate with Cloudflare Image Optimization
  // or implement WebP conversion here
  
  const headers = new Headers(response.headers)
  headers.set('Vary', 'Accept')
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: headers
  })
}

async function optimizeHTML(response) {
  let html = await response.text()
  
  // Add performance hints
  if (!html.includes('dns-prefetch')) {
    html = html.replace(
      '<head>',
      `<head>
      <link rel="dns-prefetch" href="//fonts.googleapis.com">
      <link rel="dns-prefetch" href="//www.googletagmanager.com">
      <link rel="preconnect" href="https://vitals.vercel-analytics.com">`
    )
  }
  
  // Add critical CSS inlining hints
  html = html.replace(
    '</head>',
    `  <link rel="preload" href="/_next/static/css/app.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
    </head>`
  )
  
  return new Response(html, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers
  })
}

async function minifyAsset(response, contentType) {
  // Basic minification - remove comments and extra whitespace
  let content = await response.text()
  
  if (contentType.includes('text/css')) {
    content = content.replace(/\/\*[\s\S]*?\*\//g, '')
                   .replace(/\s+/g, ' ')
                   .trim()
  }
  
  if (contentType.includes('application/javascript')) {
    // Basic JS minification (for already processed files)
    content = content.replace(/\/\/.*$/gm, '')
                   .replace(/\/\*[\s\S]*?\*\//g, '')
                   .replace(/\s+/g, ' ')
                   .trim()
  }
  
  return new Response(content, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers
  })
}