import { Analytics } from '@vercel/analytics/react';

interface DebugSession {
  id: string;
  timestamp: Date;
  userAgent: string;
  url: string;
  userId?: string;
  sessionId: string;
  errors: DebugError[];
  performance: PerformanceMetrics;
  console: ConsoleLog[];
  network: NetworkRequest[];
  userActions: UserAction[];
}

interface DebugError {
  id: string;
  timestamp: Date;
  message: string;
  stack?: string;
  type: 'javascript' | 'network' | 'render' | 'resource';
  severity: 'low' | 'medium' | 'high' | 'critical';
  url: string;
  lineNumber?: number;
  columnNumber?: number;
  source?: string;
  userId?: string;
  sessionId: string;
  context: Record<string, any>;
}

interface PerformanceMetrics {
  pageLoadTime: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  firstInputDelay: number;
  cumulativeLayoutShift: number;
  timeToInteractive: number;
  memoryUsage?: {
    used: number;
    total: number;
  };
  bundleSize: number;
  resourceTimings: ResourceTiming[];
}

interface ResourceTiming {
  name: string;
  type: string;
  startTime: number;
  duration: number;
  size: number;
  transferSize: number;
}

interface ConsoleLog {
  timestamp: Date;
  level: 'log' | 'warn' | 'error' | 'info' | 'debug';
  message: string;
  args: any[];
  stackTrace?: string;
}

interface NetworkRequest {
  id: string;
  timestamp: Date;
  method: string;
  url: string;
  status: number;
  duration: number;
  requestSize: number;
  responseSize: number;
  headers: Record<string, string>;
  error?: string;
}

interface UserAction {
  id: string;
  timestamp: Date;
  type: 'click' | 'scroll' | 'input' | 'navigation' | 'form_submit';
  element: string;
  value?: string;
  coordinates?: { x: number; y: number };
  metadata: Record<string, any>;
}

export class FrontendDebuggingAgent {
  private debugSession: DebugSession;
  private isEnabled: boolean = false;
  private maxStorageSize: number = 10 * 1024 * 1024; // 10MB
  private maxSessionDuration: number = 24 * 60 * 60 * 1000; // 24 hours

  constructor() {
    this.debugSession = this.initializeSession();
    this.initializeErrorHandlers();
    this.initializePerformanceMonitoring();
    this.initializeConsoleInterception();
    this.initializeNetworkMonitoring();
    this.initializeUserActionTracking();
  }

  /**
   * Enable debugging for the current session
   */
  enable(userId?: string): void {
    this.isEnabled = true;
    this.debugSession.userId = userId;
    
    console.log('[Debug Agent] Debugging enabled for session:', this.debugSession.id);
    
    // Store debug state in sessionStorage
    sessionStorage.setItem('debug-enabled', 'true');
    sessionStorage.setItem('debug-session-id', this.debugSession.id);
  }

  /**
   * Disable debugging
   */
  disable(): void {
    this.isEnabled = false;
    console.log('[Debug Agent] Debugging disabled');
    
    sessionStorage.removeItem('debug-enabled');
    sessionStorage.removeItem('debug-session-id');
  }

  /**
   * Check if debugging is enabled
   */
  isDebugging(): boolean {
    return this.isEnabled || sessionStorage.getItem('debug-enabled') === 'true';
  }

  /**
   * Initialize debug session
   */
  private initializeSession(): DebugSession {
    const sessionId = this.generateSessionId();
    
    return {
      id: sessionId,
      timestamp: new Date(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      sessionId,
      errors: [],
      performance: {
        pageLoadTime: 0,
        firstContentfulPaint: 0,
        largestContentfulPaint: 0,
        firstInputDelay: 0,
        cumulativeLayoutShift: 0,
        timeToInteractive: 0,
        bundleSize: 0,
        resourceTimings: [],
      },
      console: [],
      network: [],
      userActions: [],
    };
  }

  /**
   * Initialize error handlers
   */
  private initializeErrorHandlers(): void {
    // JavaScript errors
    window.addEventListener('error', (event) => {
      if (!this.isDebugging()) return;

      const error: DebugError = {
        id: this.generateId(),
        timestamp: new Date(),
        message: event.message,
        stack: event.error?.stack,
        type: 'javascript',
        severity: this.determineSeverity(event.error),
        url: event.filename || window.location.href,
        lineNumber: event.lineno,
        columnNumber: event.colno,
        source: event.error?.toString(),
        sessionId: this.debugSession.sessionId,
        context: {
          userAgent: navigator.userAgent,
          timestamp: Date.now(),
          url: window.location.href,
        },
      };

      this.debugSession.errors.push(error);
      this.reportError(error);
    });

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      if (!this.isDebugging()) return;

      const error: DebugError = {
        id: this.generateId(),
        timestamp: new Date(),
        message: event.reason?.message || 'Unhandled promise rejection',
        stack: event.reason?.stack,
        type: 'javascript',
        severity: 'high',
        url: window.location.href,
        source: event.reason?.toString(),
        sessionId: this.debugSession.sessionId,
        context: {
          promise: event.promise,
          reason: event.reason,
        },
      };

      this.debugSession.errors.push(error);
      this.reportError(error);
    });

    // Resource loading errors
    window.addEventListener('error', (event) => {
      if (!this.isDebugging()) return;
      
      const target = event.target as HTMLElement;
      if (target && target !== window) {
        const error: DebugError = {
          id: this.generateId(),
          timestamp: new Date(),
          message: `Failed to load resource: ${target.tagName}`,
          type: 'resource',
          severity: 'medium',
          url: (target as any).src || (target as any).href || window.location.href,
          sessionId: this.debugSession.sessionId,
          context: {
            tagName: target.tagName,
            src: (target as any).src,
            href: (target as any).href,
          },
        };

        this.debugSession.errors.push(error);
        this.reportError(error);
      }
    }, true);
  }

  /**
   * Initialize performance monitoring
   */
  private initializePerformanceMonitoring(): void {
    if (!('PerformanceObserver' in window)) return;

    // Core Web Vitals
    const observer = new PerformanceObserver((list) => {
      if (!this.isDebugging()) return;

      for (const entry of list.getEntries()) {
        switch (entry.entryType) {
          case 'paint':
            if (entry.name === 'first-contentful-paint') {
              this.debugSession.performance.firstContentfulPaint = entry.startTime;
            }
            break;
          case 'largest-contentful-paint':
            this.debugSession.performance.largestContentfulPaint = entry.startTime;
            break;
          case 'first-input':
            this.debugSession.performance.firstInputDelay = (entry as any).processingStart - entry.startTime;
            break;
          case 'layout-shift':
            if (!(entry as any).hadRecentInput) {
              this.debugSession.performance.cumulativeLayoutShift += (entry as any).value;
            }
            break;
          case 'resource':
            this.debugSession.performance.resourceTimings.push({
              name: entry.name,
              type: (entry as any).initiatorType,
              startTime: entry.startTime,
              duration: entry.duration,
              size: (entry as any).decodedBodySize || 0,
              transferSize: (entry as any).transferSize || 0,
            });
            break;
        }
      }
    });

    observer.observe({ entryTypes: ['paint', 'largest-contentful-paint', 'first-input', 'layout-shift', 'resource'] });

    // Memory usage monitoring
    if ('memory' in performance) {
      setInterval(() => {
        if (!this.isDebugging()) return;
        
        const memory = (performance as any).memory;
        this.debugSession.performance.memoryUsage = {
          used: memory.usedJSHeapSize,
          total: memory.totalJSHeapSize,
        };
      }, 5000);
    }

    // Page load time
    window.addEventListener('load', () => {
      if (!this.isDebugging()) return;
      
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as any;
        this.debugSession.performance.pageLoadTime = navigation.loadEventEnd - navigation.fetchStart;
        this.debugSession.performance.timeToInteractive = navigation.domInteractive - navigation.fetchStart;
      }, 0);
    });
  }

  /**
   * Initialize console interception
   */
  private initializeConsoleInterception(): void {
    const originalConsole = { ...console };

    ['log', 'warn', 'error', 'info', 'debug'].forEach((method) => {
      (console as any)[method] = (...args: any[]) => {
        if (this.isDebugging()) {
          const consoleLog: ConsoleLog = {
            timestamp: new Date(),
            level: method as any,
            message: args.map(arg => typeof arg === 'string' ? arg : JSON.stringify(arg)).join(' '),
            args,
            stackTrace: new Error().stack,
          };
          
          this.debugSession.console.push(consoleLog);
        }
        
        (originalConsole as any)[method](...args);
      };
    });
  }

  /**
   * Initialize network monitoring
   */
  private initializeNetworkMonitoring(): void {
    // Intercept fetch requests
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      if (!this.isDebugging()) {
        return originalFetch(...args);
      }

      const startTime = Date.now();
      const requestId = this.generateId();
      const url = args[0] instanceof Request ? args[0].url : args[0].toString();
      const method = args[1]?.method || 'GET';

      try {
        const response = await originalFetch(...args);
        const duration = Date.now() - startTime;

        const networkRequest: NetworkRequest = {
          id: requestId,
          timestamp: new Date(startTime),
          method,
          url,
          status: response.status,
          duration,
          requestSize: this.estimateRequestSize(args),
          responseSize: parseInt(response.headers.get('content-length') || '0'),
          headers: Object.fromEntries(response.headers.entries()),
        };

        this.debugSession.network.push(networkRequest);
        return response;
      } catch (error) {
        const duration = Date.now() - startTime;
        
        const networkRequest: NetworkRequest = {
          id: requestId,
          timestamp: new Date(startTime),
          method,
          url,
          status: 0,
          duration,
          requestSize: this.estimateRequestSize(args),
          responseSize: 0,
          headers: {},
          error: error.message,
        };

        this.debugSession.network.push(networkRequest);
        throw error;
      }
    };

    // Intercept XMLHttpRequest
    const originalXHR = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url, ...args) {
      if (frontendDebuggingAgent.isDebugging()) {
        const startTime = Date.now();
        const requestId = frontendDebuggingAgent.generateId();

        this.addEventListener('loadend', () => {
          const duration = Date.now() - startTime;
          
          const networkRequest: NetworkRequest = {
            id: requestId,
            timestamp: new Date(startTime),
            method,
            url: url.toString(),
            status: this.status,
            duration,
            requestSize: 0, // Difficult to estimate for XHR
            responseSize: this.response?.length || 0,
            headers: {},
          };

          frontendDebuggingAgent.debugSession.network.push(networkRequest);
        });
      }

      return originalXHR.call(this, method, url, ...args);
    };
  }

  /**
   * Initialize user action tracking
   */
  private initializeUserActionTracking(): void {
    // Click tracking
    document.addEventListener('click', (event) => {
      if (!this.isDebugging()) return;

      const target = event.target as HTMLElement;
      const userAction: UserAction = {
        id: this.generateId(),
        timestamp: new Date(),
        type: 'click',
        element: this.getElementSelector(target),
        coordinates: { x: event.clientX, y: event.clientY },
        metadata: {
          tagName: target.tagName,
          className: target.className,
          id: target.id,
          textContent: target.textContent?.slice(0, 100),
        },
      };

      this.debugSession.userActions.push(userAction);
    });

    // Scroll tracking
    let scrollTimeout: NodeJS.Timeout;
    window.addEventListener('scroll', () => {
      if (!this.isDebugging()) return;

      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        const userAction: UserAction = {
          id: this.generateId(),
          timestamp: new Date(),
          type: 'scroll',
          element: 'window',
          metadata: {
            scrollX: window.scrollX,
            scrollY: window.scrollY,
          },
        };

        this.debugSession.userActions.push(userAction);
      }, 100);
    });

    // Form submission tracking
    document.addEventListener('submit', (event) => {
      if (!this.isDebugging()) return;

      const form = event.target as HTMLFormElement;
      const userAction: UserAction = {
        id: this.generateId(),
        timestamp: new Date(),
        type: 'form_submit',
        element: this.getElementSelector(form),
        metadata: {
          action: form.action,
          method: form.method,
          formData: this.serializeForm(form),
        },
      };

      this.debugSession.userActions.push(userAction);
    });
  }

  /**
   * Report error to backend
   */
  private async reportError(error: DebugError): Promise<void> {
    try {
      await fetch('/api/debug/error', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(error),
      });
    } catch (reportError) {
      console.error('Failed to report error:', reportError);
    }
  }

  /**
   * Export debug session data
   */
  exportSession(): string {
    const sessionData = {
      ...this.debugSession,
      exportTimestamp: new Date(),
      version: '1.0.0',
    };

    return JSON.stringify(sessionData, null, 2);
  }

  /**
   * Clear debug session data
   */
  clearSession(): void {
    this.debugSession = this.initializeSession();
    console.log('[Debug Agent] Session data cleared');
  }

  /**
   * Get debug statistics
   */
  getStatistics(): {
    errorsCount: number;
    performanceScore: number;
    networkRequestsCount: number;
    userActionsCount: number;
    sessionDuration: number;
  } {
    const now = Date.now();
    const sessionStart = this.debugSession.timestamp.getTime();

    return {
      errorsCount: this.debugSession.errors.length,
      performanceScore: this.calculatePerformanceScore(),
      networkRequestsCount: this.debugSession.network.length,
      userActionsCount: this.debugSession.userActions.length,
      sessionDuration: now - sessionStart,
    };
  }

  /**
   * Generate unique ID
   */
  generateId(): string {
    return `debug_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Determine error severity
   */
  private determineSeverity(error: Error): 'low' | 'medium' | 'high' | 'critical' {
    if (!error) return 'low';
    
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch')) {
      return 'medium';
    }
    
    if (message.includes('syntax') || message.includes('reference')) {
      return 'high';
    }
    
    if (message.includes('security') || message.includes('unauthorized')) {
      return 'critical';
    }
    
    return 'medium';
  }

  /**
   * Estimate request size
   */
  private estimateRequestSize(args: any[]): number {
    try {
      return JSON.stringify(args).length;
    } catch {
      return 0;
    }
  }

  /**
   * Get CSS selector for element
   */
  private getElementSelector(element: HTMLElement): string {
    if (element.id) {
      return `#${element.id}`;
    }
    
    if (element.className) {
      return `.${element.className.split(' ').join('.')}`;
    }
    
    return element.tagName.toLowerCase();
  }

  /**
   * Serialize form data
   */
  private serializeForm(form: HTMLFormElement): Record<string, string> {
    const formData = new FormData(form);
    const serialized: Record<string, string> = {};
    
    for (const [key, value] of formData.entries()) {
      serialized[key] = value.toString();
    }
    
    return serialized;
  }

  /**
   * Calculate performance score
   */
  private calculatePerformanceScore(): number {
    const metrics = this.debugSession.performance;
    let score = 100;

    // Deduct points for poor metrics
    if (metrics.firstContentfulPaint > 2000) score -= 20;
    if (metrics.largestContentfulPaint > 4000) score -= 20;
    if (metrics.firstInputDelay > 100) score -= 15;
    if (metrics.cumulativeLayoutShift > 0.1) score -= 15;
    if (metrics.pageLoadTime > 5000) score -= 20;

    return Math.max(0, score);
  }
}

// Export singleton instance
export const frontendDebuggingAgent = new FrontendDebuggingAgent();