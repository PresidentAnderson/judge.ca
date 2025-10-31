import { Router, Request, Response } from 'express';
import { monitoringService } from '../middleware/monitoring';
import { redisService } from '../config/redis.config';
import { logger } from '../utils/logger';
import { testConnection } from '../utils/database';

const router = Router();

// Basic health check (used by Railway)
router.get('/', async (req: Request, res: Response) => {
  try {
    const healthCheck = await monitoringService.performHealthCheck();
    
    // Set appropriate status code based on health
    const statusCode = healthCheck.status === 'healthy' ? 200 : 
                      healthCheck.status === 'degraded' ? 206 : 503;
    
    res.status(statusCode).json(healthCheck);
  } catch (error) {
    logger.error('Health check endpoint error:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed'
    });
  }
});

// Detailed health check
router.get('/detailed', async (req: Request, res: Response) => {
  try {
    const healthCheck = await monitoringService.performHealthCheck();
    
    // Add additional details for internal monitoring
    const detailedHealth = {
      ...healthCheck,
      details: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        pid: process.pid,
        uptime: {
          process: process.uptime(),
          system: require('os').uptime()
        },
        loadAverage: require('os').loadavg(),
        freeMemory: require('os').freemem(),
        totalMemory: require('os').totalmem()
      }
    };
    
    const statusCode = healthCheck.status === 'healthy' ? 200 : 
                      healthCheck.status === 'degraded' ? 206 : 503;
    
    res.status(statusCode).json(detailedHealth);
  } catch (error) {
    logger.error('Detailed health check error:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Detailed health check failed'
    });
  }
});

// Live check (minimal response for load balancers)
router.get('/live', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString()
  });
});

// Ready check (checks if app is ready to serve traffic)
router.get('/ready', async (req: Request, res: Response) => {
  try {
    // Check critical services only
    const redisHealthy = await redisService.ping().then(() => true).catch(() => false);

    // Check database connectivity with real test
    const databaseHealthy = await testConnection();

    const isReady = redisHealthy && databaseHealthy;
    
    res.status(isReady ? 200 : 503).json({
      status: isReady ? 'ready' : 'not ready',
      timestamp: new Date().toISOString(),
      services: {
        redis: redisHealthy ? 'ready' : 'not ready',
        database: databaseHealthy ? 'ready' : 'not ready'
      }
    });
  } catch (error) {
    logger.error('Ready check error:', error);
    res.status(503).json({
      status: 'not ready',
      timestamp: new Date().toISOString(),
      error: 'Ready check failed'
    });
  }
});

// Metrics endpoint
router.get('/metrics', (req: Request, res: Response) => {
  try {
    const metrics = monitoringService.getMetrics();
    res.json(metrics);
  } catch (error) {
    logger.error('Metrics endpoint error:', error);
    res.status(500).json({
      error: 'Failed to get metrics',
      timestamp: new Date().toISOString()
    });
  }
});

// Database health check
router.get('/db', async (req: Request, res: Response) => {
  try {
    // In a real implementation, this would test database connectivity
    // Example: await db.query('SELECT 1');
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      responseTime: 10 // Placeholder
    });
  } catch (error) {
    logger.error('Database health check error:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Database check failed'
    });
  }
});

// Redis health check
router.get('/redis', async (req: Request, res: Response) => {
  try {
    const startTime = Date.now();
    const isHealthy = await redisService.ping();
    const responseTime = Date.now() - startTime;
    
    res.status(isHealthy ? 200 : 503).json({
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      responseTime
    });
  } catch (error) {
    logger.error('Redis health check error:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Redis check failed'
    });
  }
});

// WebSocket health check
router.get('/websocket', (req: Request, res: Response) => {
  try {
    // Check if WebSocket server is running
    // This is a simplified check
    const isHealthy = true; // Placeholder
    
    res.status(isHealthy ? 200 : 503).json({
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      connections: 0 // Placeholder - would show actual connection count
    });
  } catch (error) {
    logger.error('WebSocket health check error:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'WebSocket check failed'
    });
  }
});

// Version information
router.get('/version', (req: Request, res: Response) => {
  res.json({
    version: process.env.npm_package_version || '1.0.0',
    nodeVersion: process.version,
    environment: process.env.NODE_ENV || 'development',
    buildTime: process.env.BUILD_TIME || 'unknown',
    gitCommit: process.env.GIT_COMMIT || 'unknown',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// System info
router.get('/system', (req: Request, res: Response) => {
  try {
    const os = require('os');
    
    res.json({
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
      cpus: os.cpus().length,
      totalMemory: os.totalmem(),
      freeMemory: os.freemem(),
      loadAverage: os.loadavg(),
      uptime: {
        process: process.uptime(),
        system: os.uptime()
      },
      hostname: os.hostname(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('System info error:', error);
    res.status(500).json({
      error: 'Failed to get system info',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;