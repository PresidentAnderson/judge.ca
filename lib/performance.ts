import { getCLS, getFID, getFCP, getLCP, getTTFB, Metric } from 'web-vitals'

// Performance thresholds based on Core Web Vitals
export const PERFORMANCE_THRESHOLDS = {
  LCP: { good: 2500, needs_improvement: 4000 }, // Largest Contentful Paint
  FID: { good: 100, needs_improvement: 300 },   // First Input Delay
  CLS: { good: 0.1, needs_improvement: 0.25 },  // Cumulative Layout Shift
  FCP: { good: 1800, needs_improvement: 3000 }, // First Contentful Paint
  TTFB: { good: 800, needs_improvement: 1800 }, // Time to First Byte
}

// Performance tracking interface
interface PerformanceData {
  name: string
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  delta: number
  id: string
  navigationType: string
  url: string
  timestamp: number
}

// Analytics endpoint for sending metrics
const ANALYTICS_ENDPOINT = '/api/analytics/performance'

// Send performance metrics to analytics
async function sendToAnalytics(metric: PerformanceData) {
  try {
    if (process.env.NODE_ENV === 'production') {
      await fetch(ANALYTICS_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(metric),
        keepalive: true,
      })
    } else {
      console.log('📊 Performance Metric:', metric)
    }
  } catch (error) {
    console.error('Failed to send performance metric:', error)
  }
}

// Get performance rating based on thresholds
function getPerformanceRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const threshold = PERFORMANCE_THRESHOLDS[name as keyof typeof PERFORMANCE_THRESHOLDS]
  if (!threshold) return 'good'
  
  if (value <= threshold.good) return 'good'
  if (value <= threshold.needs_improvement) return 'needs-improvement'
  return 'poor'
}

// Enhanced metric handler
function handleMetric(metric: Metric) {
  const performanceData: PerformanceData = {
    name: metric.name,
    value: metric.value,
    rating: getPerformanceRating(metric.name, metric.value),
    delta: metric.delta,
    id: metric.id,
    navigationType: (performance.navigation as any)?.type || 'unknown',
    url: window.location.href,
    timestamp: Date.now(),
  }
  
  sendToAnalytics(performanceData)
}

// Initialize Web Vitals tracking
export function initializeWebVitals() {
  if (typeof window === 'undefined') return
  
  getCLS(handleMetric)
  getFID(handleMetric)
  getFCP(handleMetric)
  getLCP(handleMetric)
  getTTFB(handleMetric)
}

// Manual performance measurement utilities
export class PerformanceTracker {
  private marks: Map<string, number> = new Map()
  
  // Start timing
  mark(name: string) {
    this.marks.set(name, performance.now())
    performance.mark(`${name}-start`)
  }
  
  // End timing and measure
  measure(name: string, sendToAnalytics = true) {
    const startTime = this.marks.get(name)
    if (!startTime) {
      console.warn(`No start mark found for: ${name}`)
      return 0
    }
    
    const endTime = performance.now()
    const duration = endTime - startTime
    
    performance.mark(`${name}-end`)
    performance.measure(name, `${name}-start`, `${name}-end`)
    
    if (sendToAnalytics) {
      const metric: PerformanceData = {
        name: `custom-${name}`,
        value: duration,
        rating: duration < 100 ? 'good' : duration < 1000 ? 'needs-improvement' : 'poor',
        delta: duration,
        id: `custom-${Date.now()}`,
        navigationType: 'custom',
        url: window.location.href,
        timestamp: Date.now(),
      }
      
      sendToAnalytics(metric)
    }
    
    this.marks.delete(name)
    return duration
  }
  
  // Clear all marks
  clear() {
    this.marks.clear()
    performance.clearMarks()
    performance.clearMeasures()
  }
}

// Global performance tracker instance
export const performanceTracker = new PerformanceTracker()

// Resource loading performance
export function measureResourceLoading() {
  if (typeof window === 'undefined') return
  
  window.addEventListener('load', () => {
    // Measure navigation timing
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    
    if (navigation) {
      const metrics = {
        'dns-lookup': navigation.domainLookupEnd - navigation.domainLookupStart,
        'tcp-connect': navigation.connectEnd - navigation.connectStart,
        'ssl-negotiation': navigation.connectEnd - navigation.secureConnectionStart,
        'request-response': navigation.responseEnd - navigation.requestStart,
        'dom-processing': navigation.domContentLoadedEventStart - navigation.responseEnd,
        'resource-loading': navigation.loadEventStart - navigation.domContentLoadedEventStart,
      }
      
      Object.entries(metrics).forEach(([name, value]) => {
        if (value > 0) {
          const metric: PerformanceData = {
            name: `navigation-${name}`,
            value,
            rating: value < 100 ? 'good' : value < 1000 ? 'needs-improvement' : 'poor',
            delta: value,
            id: `nav-${name}-${Date.now()}`,
            navigationType: 'navigation',
            url: window.location.href,
            timestamp: Date.now(),
          }
          
          sendToAnalytics(metric)
        }
      })
    }
    
    // Measure resource timing
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
    
    resources.forEach(resource => {
      if (resource.duration > 1000) { // Only track slow resources
        const metric: PerformanceData = {
          name: 'slow-resource',
          value: resource.duration,
          rating: 'poor',
          delta: resource.duration,
          id: `resource-${Date.now()}`,
          navigationType: 'resource',
          url: resource.name,
          timestamp: Date.now(),
        }
        
        sendToAnalytics(metric)
      }
    })
  })
}

// Device and connection info
export function getDeviceInfo() {
  if (typeof window === 'undefined') return {}
  
  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
  
  return {
    deviceMemory: (navigator as any).deviceMemory || 'unknown',
    hardwareConcurrency: navigator.hardwareConcurrency || 'unknown',
    connectionType: connection?.effectiveType || 'unknown',
    connectionDownlink: connection?.downlink || 'unknown',
    connectionRtt: connection?.rtt || 'unknown',
    userAgent: navigator.userAgent,
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
    },
    screen: {
      width: window.screen.width,
      height: window.screen.height,
      pixelRatio: window.devicePixelRatio,
    },
  }
}

// Performance budget alerts
export function checkPerformanceBudget(metric: PerformanceData) {
  const budgets = {
    LCP: 2500,
    FID: 100,
    CLS: 0.1,
    'bundle-size': 250000, // 250KB
    'page-load': 3000,
  }
  
  const budget = budgets[metric.name as keyof typeof budgets]
  if (budget && metric.value > budget) {
    console.warn(`🚨 Performance Budget Exceeded: ${metric.name} = ${metric.value} (budget: ${budget})`)
    
    // Send alert to monitoring service
    if (process.env.NODE_ENV === 'production') {
      fetch('/api/alerts/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'performance-budget-exceeded',
          metric: metric.name,
          value: metric.value,
          budget,
          url: window.location.href,
          timestamp: Date.now(),
        }),
      }).catch(console.error)
    }
  }
}