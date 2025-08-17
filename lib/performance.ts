import { analytics, AnalyticsEvents } from './analytics';

// Performance metrics interface
interface PerformanceMetrics {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta?: number;
}

// Web Vitals thresholds
const WEB_VITALS_THRESHOLDS = {
  CLS: { good: 0.1, poor: 0.25 },
  FID: { good: 100, poor: 300 },
  FCP: { good: 1800, poor: 3000 },
  LCP: { good: 2500, poor: 4000 },
  TTFB: { good: 800, poor: 1800 },
  INP: { good: 200, poor: 500 }
};

// Performance observer for Web Vitals
let webVitalsObserver: PerformanceObserver | null = null;

export function initializeWebVitals() {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
    return;
  }

  try {
    // Observe Core Web Vitals
    observeCLS();
    observeFCP();
    observeLCP();
    observeFID();
    observeTTFB();
    
    // Additional performance metrics
    observeResourceTimings();
    observeNavigationTimings();

    console.log('Web Vitals monitoring initialized');
  } catch (error) {
    console.error('Failed to initialize Web Vitals monitoring:', error);
  }
}

// Cumulative Layout Shift (CLS)
function observeCLS() {
  let clsValue = 0;
  let clsEntries: LayoutShift[] = [];

  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries() as LayoutShift[]) {
      // Only count layout shifts that occur without user input
      if (!entry.hadRecentInput) {
        clsValue += entry.value;
        clsEntries.push(entry);
      }
    }
  });

  observer.observe({ type: 'layout-shift', buffered: true });

  // Report CLS when the page is hidden
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && clsValue > 0) {
      reportWebVital({
        name: 'CLS',
        value: clsValue,
        rating: getRating(clsValue, WEB_VITALS_THRESHOLDS.CLS)
      });
    }
  });
}

// First Contentful Paint (FCP)
function observeFCP() {
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.name === 'first-contentful-paint') {
        reportWebVital({
          name: 'FCP',
          value: entry.startTime,
          rating: getRating(entry.startTime, WEB_VITALS_THRESHOLDS.FCP)
        });
        observer.disconnect();
      }
    }
  });

  observer.observe({ type: 'paint', buffered: true });
}

// Largest Contentful Paint (LCP)
function observeLCP() {
  let lcpValue = 0;

  const observer = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    const lastEntry = entries[entries.length - 1];
    lcpValue = lastEntry.startTime;
  });

  observer.observe({ type: 'largest-contentful-paint', buffered: true });

  // Report LCP when the page is hidden
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && lcpValue > 0) {
      reportWebVital({
        name: 'LCP',
        value: lcpValue,
        rating: getRating(lcpValue, WEB_VITALS_THRESHOLDS.LCP)
      });
    }
  });
}

// First Input Delay (FID)
function observeFID() {
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries() as PerformanceEventTiming[]) {
      const fid = entry.processingStart - entry.startTime;
      reportWebVital({
        name: 'FID',
        value: fid,
        rating: getRating(fid, WEB_VITALS_THRESHOLDS.FID)
      });
      observer.disconnect();
    }
  });

  observer.observe({ type: 'first-input', buffered: true });
}

// Time to First Byte (TTFB)
function observeTTFB() {
  if ('navigation' in performance) {
    const navigationTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigationTiming) {
      const ttfb = navigationTiming.responseStart - navigationTiming.requestStart;
      reportWebVital({
        name: 'TTFB',
        value: ttfb,
        rating: getRating(ttfb, WEB_VITALS_THRESHOLDS.TTFB)
      });
    }
  }
}

// Resource timing observation
function observeResourceTimings() {
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries() as PerformanceResourceTiming[]) {
      analyzeResourceTiming(entry);
    }
  });

  observer.observe({ type: 'resource', buffered: true });
}

// Navigation timing observation
function observeNavigationTimings() {
  if ('navigation' in performance) {
    const navigationTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigationTiming) {
      analyzeNavigationTiming(navigationTiming);
    }
  }
}

// Analyze resource loading performance
function analyzeResourceTiming(entry: PerformanceResourceTiming) {
  const loadTime = entry.responseEnd - entry.startTime;
  const resourceType = getResourceType(entry.name);

  // Track slow resources (>2 seconds)
  if (loadTime > 2000) {
    analytics.track(AnalyticsEvents.PAGE_LOAD_TIME, {
      event_category: 'performance',
      event_label: `slow_resource_${resourceType}`,
      value: Math.round(loadTime),
      resource_url: entry.name,
      resource_type: resourceType
    });
  }

  // Track failed resources
  if (entry.transferSize === 0 && entry.decodedBodySize === 0) {
    analytics.track(AnalyticsEvents.ERROR_OCCURRED, {
      event_category: 'performance',
      event_label: 'resource_load_failed',
      error_message: `Failed to load ${resourceType}: ${entry.name}`,
      resource_url: entry.name,
      resource_type: resourceType
    });
  }
}

// Analyze navigation performance
function analyzeNavigationTiming(timing: PerformanceNavigationTiming) {
  const metrics = {
    dns_lookup: timing.domainLookupEnd - timing.domainLookupStart,
    tcp_connection: timing.connectEnd - timing.connectStart,
    ssl_handshake: timing.secureConnectionStart > 0 ? timing.connectEnd - timing.secureConnectionStart : 0,
    server_response: timing.responseEnd - timing.requestStart,
    dom_processing: timing.domContentLoadedEventEnd - timing.responseEnd,
    page_load: timing.loadEventEnd - timing.navigationStart
  };

  // Report each metric
  Object.entries(metrics).forEach(([name, value]) => {
    if (value > 0) {
      analytics.trackPerformance(name, value, window.location.pathname);
    }
  });

  // Check for performance issues
  if (metrics.server_response > 2000) {
    analytics.track(AnalyticsEvents.ERROR_OCCURRED, {
      event_category: 'performance',
      event_label: 'slow_server_response',
      error_message: `Slow server response: ${Math.round(metrics.server_response)}ms`,
      value: Math.round(metrics.server_response)
    });
  }
}

// Report Web Vital metrics
function reportWebVital(metric: PerformanceMetrics) {
  // Send to analytics
  analytics.trackPerformance(`web_vitals_${metric.name.toLowerCase()}`, metric.value);

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`Web Vital - ${metric.name}:`, {
      value: Math.round(metric.value),
      rating: metric.rating,
      threshold: WEB_VITALS_THRESHOLDS[metric.name as keyof typeof WEB_VITALS_THRESHOLDS]
    });
  }

  // Alert for poor performance
  if (metric.rating === 'poor') {
    analytics.track(AnalyticsEvents.ERROR_OCCURRED, {
      event_category: 'performance',
      event_label: `poor_web_vital_${metric.name.toLowerCase()}`,
      error_message: `Poor ${metric.name} score: ${Math.round(metric.value)}`,
      value: Math.round(metric.value)
    });
  }
}

// Get performance rating based on thresholds
function getRating(value: number, thresholds: { good: number; poor: number }): 'good' | 'needs-improvement' | 'poor' {
  if (value <= thresholds.good) return 'good';
  if (value <= thresholds.poor) return 'needs-improvement';
  return 'poor';
}

// Get resource type from URL
function getResourceType(url: string): string {
  if (url.includes('.js')) return 'script';
  if (url.includes('.css')) return 'stylesheet';
  if (url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) return 'image';
  if (url.match(/\.(woff|woff2|ttf|otf)$/i)) return 'font';
  if (url.includes('api/')) return 'api';
  return 'other';
}

// Measure resource loading times
export function measureResourceLoading() {
  if (typeof window === 'undefined') return;

  // Measure when all resources are loaded
  window.addEventListener('load', () => {
    const loadTime = performance.now();
    analytics.trackPerformance('page_load_complete', loadTime);

    // Analyze paint timings
    const paintEntries = performance.getEntriesByType('paint');
    paintEntries.forEach((entry) => {
      analytics.trackPerformance(entry.name.replace('-', '_'), entry.startTime);
    });
  });

  // Measure when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      const domLoadTime = performance.now();
      analytics.trackPerformance('dom_content_loaded', domLoadTime);
    });
  }
}

// Track long tasks that block the main thread
export function trackLongTasks() {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
    return;
  }

  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        // Long tasks are entries with duration > 50ms
        if (entry.duration > 50) {
          analytics.track(AnalyticsEvents.ERROR_OCCURRED, {
            event_category: 'performance',
            event_label: 'long_task',
            error_message: `Long task detected: ${Math.round(entry.duration)}ms`,
            value: Math.round(entry.duration),
            start_time: Math.round(entry.startTime)
          });
        }
      }
    });

    observer.observe({ type: 'longtask', buffered: true });
  } catch (error) {
    console.warn('Long task tracking not supported:', error);
  }
}

// Memory usage tracking
export function trackMemoryUsage() {
  if (typeof window === 'undefined' || !('memory' in performance)) {
    return;
  }

  try {
    const memory = (performance as any).memory;
    const memoryInfo = {
      used: Math.round(memory.usedJSHeapSize / 1048576), // MB
      total: Math.round(memory.totalJSHeapSize / 1048576), // MB
      limit: Math.round(memory.jsHeapSizeLimit / 1048576) // MB
    };

    // Track if memory usage is high (>80% of limit)
    const memoryUsagePercent = (memoryInfo.used / memoryInfo.limit) * 100;
    if (memoryUsagePercent > 80) {
      analytics.track(AnalyticsEvents.ERROR_OCCURRED, {
        event_category: 'performance',
        event_label: 'high_memory_usage',
        error_message: `High memory usage: ${Math.round(memoryUsagePercent)}%`,
        value: Math.round(memoryUsagePercent),
        memory_used_mb: memoryInfo.used,
        memory_limit_mb: memoryInfo.limit
      });
    }

    analytics.trackPerformance('memory_usage_mb', memoryInfo.used);
  } catch (error) {
    console.warn('Memory tracking not supported:', error);
  }
}

// Custom performance mark and measure
export function markPerformance(name: string) {
  if (typeof window !== 'undefined' && 'performance' in window) {
    performance.mark(name);
  }
}

export function measurePerformance(name: string, startMark: string, endMark?: string) {
  if (typeof window !== 'undefined' && 'performance' in window) {
    try {
      if (endMark) {
        performance.measure(name, startMark, endMark);
      } else {
        performance.measure(name, startMark);
      }

      const measure = performance.getEntriesByName(name, 'measure')[0];
      if (measure) {
        analytics.trackPerformance(name, measure.duration);
      }
    } catch (error) {
      console.warn('Performance measurement failed:', error);
    }
  }
}

// Initialize all performance monitoring
export function initializePerformanceMonitoring() {
  initializeWebVitals();
  measureResourceLoading();
  trackLongTasks();
  
  // Track memory usage every 30 seconds
  if (typeof window !== 'undefined') {
    setInterval(trackMemoryUsage, 30000);
  }
}

// Interface definitions for TypeScript
interface LayoutShift extends PerformanceEntry {
  value: number;
  hadRecentInput: boolean;
}

interface PerformanceEventTiming extends PerformanceEntry {
  processingStart: number;
  cancelable: boolean;
}