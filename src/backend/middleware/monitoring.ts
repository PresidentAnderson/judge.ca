import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { redisService } from '../config/redis.config';

interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  services: {
    database: HealthCheckStatus;
    redis: HealthCheckStatus;
    websocket: HealthCheckStatus;
    external: HealthCheckStatus;
  };
  metrics: {
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
    cpu: {
      usage: number;
    };
    requests: {
      total: number;
      successful: number;
      failed: number;
      averageResponseTime: number;
    };
  };
}

interface HealthCheckStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  responseTime: number;
  error?: string;
  lastCheck: string;
}

interface RequestMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  responseTimes: number[];
  lastReset: number;
}

class MonitoringService {
  private requestMetrics: RequestMetrics = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    responseTimes: [],
    lastReset: Date.now()
  };

  private healthCache: HealthCheckResult | null = null;
  private lastHealthCheck = 0;
  private readonly HEALTH_CACHE_TTL = 30000; // 30 seconds

  // Middleware to track request metrics
  requestTracker = (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    this.requestMetrics.totalRequests++;

    // Override end method to capture response time
    const originalEnd = res.end;
    res.end = function(chunk?: any, encoding?: any) {
      const responseTime = Date.now() - startTime;
      
      // Track response time (keep only last 1000 requests)
      if (this.requestMetrics.responseTimes.length >= 1000) {
        this.requestMetrics.responseTimes.shift();
      }
      this.requestMetrics.responseTimes.push(responseTime);

      // Track success/failure
      if (res.statusCode >= 200 && res.statusCode < 400) {
        this.requestMetrics.successfulRequests++;
      } else {
        this.requestMetrics.failedRequests++;
      }

      return originalEnd.call(this, chunk, encoding);
    }.bind(this);

    next();
  };

  // Error tracking middleware
  errorTracker = (error: Error, req: Request, res: Response, next: NextFunction) => {
    logger.error('Request error:', {
      error: error.message,
      stack: error.stack,
      url: req.url,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      timestamp: new Date().toISOString()
    });

    // Send error to external monitoring service (e.g., Sentry)
    this.sendErrorToMonitoring(error, req);

    next(error);
  };

  // Check database health
  private async checkDatabaseHealth(): Promise<HealthCheckStatus> {
    const startTime = Date.now();
    
    try {
      // This would be replaced with actual database health check
      // For example: await db.query('SELECT 1');
      
      // Simulate database check
      await new Promise(resolve => setTimeout(resolve, 10));
      
      return {
        status: 'healthy',
        responseTime: Date.now() - startTime,
        lastCheck: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Database health check failed:', error);
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        lastCheck: new Date().toISOString()
      };
    }
  }

  // Check Redis health
  private async checkRedisHealth(): Promise<HealthCheckStatus> {
    const startTime = Date.now();
    
    try {
      const isConnected = await redisService.ping();
      
      return {
        status: isConnected ? 'healthy' : 'unhealthy',
        responseTime: Date.now() - startTime,
        error: isConnected ? undefined : 'Redis ping failed',
        lastCheck: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Redis health check failed:', error);
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        lastCheck: new Date().toISOString()
      };
    }
  }

  // Check WebSocket health
  private async checkWebSocketHealth(): Promise<HealthCheckStatus> {
    const startTime = Date.now();
    
    try {
      // In a real implementation, you might check WebSocket server status
      // For now, we'll assume it's healthy if the process is running
      
      return {
        status: 'healthy',
        responseTime: Date.now() - startTime,
        lastCheck: new Date().toISOString()
      };
    } catch (error) {
      logger.error('WebSocket health check failed:', error);
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        lastCheck: new Date().toISOString()
      };
    }
  }

  // Check external services health
  private async checkExternalServicesHealth(): Promise<HealthCheckStatus> {
    const startTime = Date.now();
    
    try {
      // Check external services like Stripe, email service, etc.
      // For now, we'll return healthy
      
      return {
        status: 'healthy',
        responseTime: Date.now() - startTime,
        lastCheck: new Date().toISOString()
      };
    } catch (error) {
      logger.error('External services health check failed:', error);
      return {
        status: 'degraded',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        lastCheck: new Date().toISOString()
      };
    }
  }

  // Get system metrics
  private getSystemMetrics() {
    const memUsage = process.memoryUsage();
    const totalMemory = require('os').totalmem();
    
    return {
      memory: {
        used: memUsage.heapUsed,
        total: totalMemory,
        percentage: Math.round((memUsage.heapUsed / totalMemory) * 100)
      },
      cpu: {
        usage: process.cpuUsage().user / 1000000 // Convert to seconds
      },
      requests: {
        total: this.requestMetrics.totalRequests,
        successful: this.requestMetrics.successfulRequests,
        failed: this.requestMetrics.failedRequests,
        averageResponseTime: this.requestMetrics.responseTimes.length > 0 
          ? Math.round(this.requestMetrics.responseTimes.reduce((a, b) => a + b, 0) / this.requestMetrics.responseTimes.length)
          : 0
      }
    };
  }

  // Comprehensive health check
  async performHealthCheck(): Promise<HealthCheckResult> {
    // Return cached result if still valid
    const now = Date.now();
    if (this.healthCache && (now - this.lastHealthCheck) < this.HEALTH_CACHE_TTL) {
      return this.healthCache;
    }

    logger.info('Performing health check...');

    try {
      const [database, redis, websocket, external] = await Promise.all([
        this.checkDatabaseHealth(),
        this.checkRedisHealth(),
        this.checkWebSocketHealth(),
        this.checkExternalServicesHealth()
      ]);

      const services = { database, redis, websocket, external };
      
      // Determine overall status
      let overallStatus: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
      
      const unhealthyServices = Object.values(services).filter(s => s.status === 'unhealthy');
      const degradedServices = Object.values(services).filter(s => s.status === 'degraded');
      
      if (unhealthyServices.length > 0) {
        overallStatus = 'unhealthy';
      } else if (degradedServices.length > 0) {
        overallStatus = 'degraded';
      }

      const result: HealthCheckResult = {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        services,
        metrics: this.getSystemMetrics()
      };

      // Cache the result
      this.healthCache = result;
      this.lastHealthCheck = now;

      logger.info(`Health check completed. Status: ${overallStatus}`);
      return result;
    } catch (error) {
      logger.error('Health check failed:', error);
      
      const errorResult: HealthCheckResult = {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        services: {
          database: { status: 'unhealthy', responseTime: 0, error: 'Health check failed', lastCheck: new Date().toISOString() },
          redis: { status: 'unhealthy', responseTime: 0, error: 'Health check failed', lastCheck: new Date().toISOString() },
          websocket: { status: 'unhealthy', responseTime: 0, error: 'Health check failed', lastCheck: new Date().toISOString() },
          external: { status: 'unhealthy', responseTime: 0, error: 'Health check failed', lastCheck: new Date().toISOString() }
        },
        metrics: this.getSystemMetrics()
      };

      this.healthCache = errorResult;
      this.lastHealthCheck = now;
      
      return errorResult;
    }
  }

  // Send error to external monitoring service
  private sendErrorToMonitoring(error: Error, req: Request) {
    // In a real implementation, you would send this to Sentry, DataDog, etc.
    // For now, we'll just log it
    
    const errorData = {
      message: error.message,
      stack: error.stack,
      url: req.url,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV
    };

    // TODO: Send to external monitoring service
    logger.error('Error sent to monitoring:', errorData);
  }

  // Reset metrics (called periodically)
  resetMetrics() {
    this.requestMetrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      responseTimes: [],
      lastReset: Date.now()
    };
    
    logger.info('Request metrics reset');
  }

  // Get current metrics
  getMetrics() {
    return {
      ...this.requestMetrics,
      systemMetrics: this.getSystemMetrics()
    };
  }
}

// Export singleton instance
export const monitoringService = new MonitoringService();
export default monitoringService;