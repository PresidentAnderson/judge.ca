import { Router, Request, Response } from 'express';
import { backendDeploymentAgent } from '../services/deployment-agent.service';
import { authMiddleware } from '../middleware/auth.middleware';
import { adminMiddleware } from '../middleware/admin.middleware';
import { rateLimitMiddleware } from '../middleware/rate-limit.middleware';

const router = Router();

// Apply authentication and admin middleware to all deployment routes
router.use(authMiddleware);
router.use(adminMiddleware);
router.use(rateLimitMiddleware({ maxRequests: 10, windowMs: 60000 })); // 10 requests per minute

/**
 * POST /api/deployment/deploy
 * Start a new deployment
 */
router.post('/deploy', async (req: Request, res: Response) => {
  try {
    const {
      platform = 'vercel',
      environment = 'staging',
      branch,
      autoPromote = false,
      healthCheckUrl,
      environmentVariables,
    } = req.body;

    // Validate required fields
    if (!platform || !environment) {
      return res.status(400).json({
        error: 'Missing required fields: platform and environment',
      });
    }

    // Validate platform
    if (!['vercel', 'docker', 'manual'].includes(platform)) {
      return res.status(400).json({
        error: 'Invalid platform. Must be one of: vercel, docker, manual',
      });
    }

    // Validate environment
    if (!['development', 'staging', 'production'].includes(environment)) {
      return res.status(400).json({
        error: 'Invalid environment. Must be one of: development, staging, production',
      });
    }

    const deploymentConfig = {
      platform,
      environment,
      branch,
      autoPromote,
      healthCheckUrl: healthCheckUrl || `https://judgeca-axaiinovation.vercel.app/api/health`,
      environmentVariables,
    };

    const deployment = await backendDeploymentAgent.deployBackend(deploymentConfig);

    res.status(201).json({
      success: true,
      deployment,
      message: 'Deployment started successfully',
    });
  } catch (error) {
    const err = error as Error;
    console.error('Deployment error:', error);
    res.status(500).json({
      error: 'Deployment failed',
      message: err.message,
    });
  }
});

/**
 * GET /api/deployment/status/:deploymentId
 * Get deployment status by ID
 */
router.get('/status/:deploymentId', (req: Request, res: Response) => {
  try {
    const { deploymentId } = req.params;
    const deployment = backendDeploymentAgent.getDeploymentStatus(deploymentId);

    if (!deployment) {
      return res.status(404).json({
        error: 'Deployment not found',
      });
    }

    res.json({
      success: true,
      deployment,
    });
  } catch (error) {
    const err = error as Error;
    console.error('Get deployment status error:', error);
    res.status(500).json({
      error: 'Failed to get deployment status',
      message: err.message,
    });
  }
});

/**
 * GET /api/deployment/history
 * Get deployment history
 */
router.get('/history', (req: Request, res: Response) => {
  try {
    const { limit = 20, environment, platform, status } = req.query;
    let deployments = backendDeploymentAgent.getDeploymentHistory();

    // Apply filters
    if (environment) {
      deployments = deployments.filter(d => d.environment === environment);
    }
    if (platform) {
      deployments = deployments.filter(d => d.platform === platform);
    }
    if (status) {
      deployments = deployments.filter(d => d.status === status);
    }

    // Apply limit
    deployments = deployments.slice(0, parseInt(limit as string));

    res.json({
      success: true,
      deployments,
      total: deployments.length,
    });
  } catch (error) {
    const err = error as Error;
    console.error('Get deployment history error:', error);
    res.status(500).json({
      error: 'Failed to get deployment history',
      message: err.message,
    });
  }
});

/**
 * POST /api/deployment/cancel/:deploymentId
 * Cancel a deployment
 */
router.post('/cancel/:deploymentId', async (req: Request, res: Response) => {
  try {
    const { deploymentId } = req.params;
    const cancelled = await backendDeploymentAgent.cancelDeployment(deploymentId);

    if (!cancelled) {
      return res.status(400).json({
        error: 'Cannot cancel deployment',
        message: 'Deployment not found or not in cancellable state',
      });
    }

    res.json({
      success: true,
      message: 'Deployment cancelled successfully',
    });
  } catch (error) {
    const err = error as Error;
    console.error('Cancel deployment error:', error);
    res.status(500).json({
      error: 'Failed to cancel deployment',
      message: err.message,
    });
  }
});

/**
 * POST /api/deployment/rollback/:deploymentId
 * Rollback to a previous deployment
 */
router.post('/rollback/:deploymentId', async (req: Request, res: Response) => {
  try {
    const { deploymentId } = req.params;
    const {
      platform = 'vercel',
      environment = 'staging',
      healthCheckUrl,
    } = req.body;

    const rollbackConfig = {
      platform,
      environment,
      healthCheckUrl: healthCheckUrl || `https://judgeca-axaiinovation.vercel.app/api/health`,
    };

    const deployment = await backendDeploymentAgent.rollbackDeployment(
      deploymentId,
      rollbackConfig
    );

    res.json({
      success: true,
      deployment,
      message: 'Rollback started successfully',
    });
  } catch (error) {
    const err = error as Error;
    console.error('Rollback deployment error:', error);
    res.status(500).json({
      error: 'Rollback failed',
      message: err.message,
    });
  }
});

/**
 * GET /api/deployment/metrics
 * Get deployment metrics and statistics
 */
router.get('/metrics', (req: Request, res: Response) => {
  try {
    const metrics = backendDeploymentAgent.getDeploymentMetrics();

    res.json({
      success: true,
      metrics,
    });
  } catch (error) {
    const err = error as Error;
    console.error('Get deployment metrics error:', error);
    res.status(500).json({
      error: 'Failed to get deployment metrics',
      message: err.message,
    });
  }
});

/**
 * GET /api/deployment/health
 * Health check endpoint for the deployment service
 */
router.get('/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    status: 'healthy',
    service: 'backend-deployment-agent',
    timestamp: new Date().toISOString(),
  });
});

export default router;