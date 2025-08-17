import { NextApiRequest, NextApiResponse } from 'next';
import * as Sentry from '@sentry/nextjs';

interface UptimeCheck {
  timestamp: string;
  status: 'up' | 'down' | 'degraded';
  responseTime: number;
  checks: {
    database: boolean;
    redis: boolean;
    external_apis: boolean;
    file_storage: boolean;
  };
  errors: string[];
}

interface SystemHealth {
  overall_status: 'operational' | 'degraded' | 'down';
  uptime_percentage: number;
  last_incident: string | null;
  response_time_avg: number;
  checks: UptimeCheck[];
}

// In-memory storage for demonstration (use Redis or database in production)
let healthChecks: UptimeCheck[] = [];
let lastFullCheck = Date.now();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SystemHealth | { error: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const currentTime = Date.now();
    
    // Perform health check every 5 minutes
    if (currentTime - lastFullCheck > 5 * 60 * 1000) {
      const healthCheck = await performHealthCheck();
      healthChecks.push(healthCheck);
      lastFullCheck = currentTime;

      // Keep only last 288 checks (24 hours with 5-minute intervals)
      if (healthChecks.length > 288) {
        healthChecks = healthChecks.slice(-288);
      }

      // Send to StatusPage API if configured
      await updateStatusPage(healthCheck);
    }

    // Calculate system health metrics
    const systemHealth = calculateSystemHealth();

    res.status(200).json(systemHealth);
  } catch (error) {
    console.error('Uptime monitoring error:', error);
    
    Sentry.captureException(error, {
      tags: {
        section: 'monitoring',
        endpoint: 'uptime'
      }
    });

    res.status(500).json({ 
      error: 'Failed to check system health' 
    });
  }
}

async function performHealthCheck(): Promise<UptimeCheck> {
  const startTime = Date.now();
  const errors: string[] = [];
  
  const checks = {
    database: await checkDatabase(),
    redis: await checkRedis(),
    external_apis: await checkExternalAPIs(),
    file_storage: await checkFileStorage()
  };

  // Collect errors for failed checks
  if (!checks.database) errors.push('Database connection failed');
  if (!checks.redis) errors.push('Redis connection failed');
  if (!checks.external_apis) errors.push('External API checks failed');
  if (!checks.file_storage) errors.push('File storage checks failed');

  const responseTime = Date.now() - startTime;
  
  // Determine overall status
  let status: 'up' | 'down' | 'degraded' = 'up';
  if (errors.length > 0) {
    status = errors.length >= 3 ? 'down' : 'degraded';
  }

  const healthCheck: UptimeCheck = {
    timestamp: new Date().toISOString(),
    status,
    responseTime,
    checks,
    errors
  };

  // Log critical issues
  if (status === 'down') {
    console.error('CRITICAL: System is down', { errors, responseTime });
    Sentry.captureMessage('System health check failed - CRITICAL', {
      level: 'error',
      tags: { section: 'monitoring', severity: 'critical' },
      extra: { healthCheck }
    });
  } else if (status === 'degraded') {
    console.warn('WARNING: System is degraded', { errors, responseTime });
    Sentry.captureMessage('System health check degraded - WARNING', {
      level: 'warning',
      tags: { section: 'monitoring', severity: 'warning' },
      extra: { healthCheck }
    });
  }

  return healthCheck;
}

async function checkDatabase(): Promise<boolean> {
  try {
    // In production, check actual database connection
    // For now, simulate a check
    await new Promise(resolve => setTimeout(resolve, 50));
    return Math.random() > 0.05; // 95% success rate
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

async function checkRedis(): Promise<boolean> {
  try {
    // In production, check actual Redis connection
    // For now, simulate a check
    await new Promise(resolve => setTimeout(resolve, 30));
    return Math.random() > 0.02; // 98% success rate
  } catch (error) {
    console.error('Redis health check failed:', error);
    return false;
  }
}

async function checkExternalAPIs(): Promise<boolean> {
  try {
    // Check critical external services
    const services = [
      'https://api.stripe.com/v1/customers', // Stripe API
      'https://api.sendgrid.com/v3/mail/send', // SendGrid API
    ];

    const results = await Promise.allSettled(
      services.map(async (url) => {
        const response = await fetch(url, {
          method: 'HEAD',
          timeout: 5000
        });
        return response.status < 500;
      })
    );

    // At least 80% of services should be up
    const successCount = results.filter(result => 
      result.status === 'fulfilled' && result.value
    ).length;
    
    return successCount / services.length >= 0.8;
  } catch (error) {
    console.error('External API health check failed:', error);
    return false;
  }
}

async function checkFileStorage(): Promise<boolean> {
  try {
    // In production, check file storage (AWS S3, Google Cloud, etc.)
    // For now, simulate a check
    await new Promise(resolve => setTimeout(resolve, 100));
    return Math.random() > 0.01; // 99% success rate
  } catch (error) {
    console.error('File storage health check failed:', error);
    return false;
  }
}

function calculateSystemHealth(): SystemHealth {
  if (healthChecks.length === 0) {
    return {
      overall_status: 'operational',
      uptime_percentage: 100,
      last_incident: null,
      response_time_avg: 0,
      checks: []
    };
  }

  // Calculate uptime percentage for last 24 hours
  const recentChecks = healthChecks.slice(-288); // Last 24 hours
  const upChecks = recentChecks.filter(check => check.status === 'up').length;
  const uptimePercentage = (upChecks / recentChecks.length) * 100;

  // Find last incident
  const lastIncident = recentChecks
    .reverse()
    .find(check => check.status === 'down' || check.status === 'degraded');

  // Calculate average response time
  const totalResponseTime = recentChecks.reduce((sum, check) => sum + check.responseTime, 0);
  const avgResponseTime = totalResponseTime / recentChecks.length;

  // Determine overall status
  let overallStatus: 'operational' | 'degraded' | 'down' = 'operational';
  const latestCheck = healthChecks[healthChecks.length - 1];
  
  if (latestCheck) {
    if (latestCheck.status === 'down') {
      overallStatus = 'down';
    } else if (latestCheck.status === 'degraded' || uptimePercentage < 99.9) {
      overallStatus = 'degraded';
    }
  }

  return {
    overall_status: overallStatus,
    uptime_percentage: Math.round(uptimePercentage * 100) / 100,
    last_incident: lastIncident?.timestamp || null,
    response_time_avg: Math.round(avgResponseTime),
    checks: healthChecks.slice(-20) // Return last 20 checks for display
  };
}

async function updateStatusPage(healthCheck: UptimeCheck) {
  const statusPagePageId = process.env.STATUSPAGE_PAGE_ID;
  const statusPageApiKey = process.env.STATUSPAGE_API_KEY;

  if (!statusPagePageId || !statusPageApiKey) {
    console.log('StatusPage credentials not configured, skipping update');
    return;
  }

  try {
    // Map our status to StatusPage status
    const statusPageStatus = {
      'up': 'operational',
      'degraded': 'degraded_performance',
      'down': 'major_outage'
    }[healthCheck.status];

    // Update component status on StatusPage
    const response = await fetch(
      `https://api.statuspage.io/v1/pages/${statusPagePageId}/components`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `OAuth ${statusPageApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          component: {
            status: statusPageStatus,
            description: healthCheck.errors.length > 0 ? healthCheck.errors.join(', ') : null
          }
        })
      }
    );

    if (!response.ok) {
      throw new Error(`StatusPage API error: ${response.status}`);
    }

    console.log('StatusPage updated successfully');
  } catch (error) {
    console.error('Failed to update StatusPage:', error);
    Sentry.captureException(error, {
      tags: { section: 'monitoring', service: 'statuspage' }
    });
  }
}

// Export for internal use
export { performHealthCheck, calculateSystemHealth };