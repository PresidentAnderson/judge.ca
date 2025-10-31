/**
 * Deployment Configuration for Judge.ca Platform
 */

const deploymentConfig = {
  // Platform settings
  platforms: {
    vercel: {
      projectName: 'judge.ca',
      organizationId: 'axaiinovation',
      buildCommand: 'npm run build',
      outputDirectory: '.next',
      installCommand: 'npm install',
      framework: 'nextjs',
      nodeVersion: '18.x',
    },
    docker: {
      imageName: 'judge-ca',
      containerName: 'judge-ca-container',
      ports: {
        development: '3001:3000',
        staging: '3002:3000',
        production: '80:3000',
      },
      healthCheck: {
        command: 'curl -f http://localhost:3000/api/health || exit 1',
        interval: '30s',
        timeout: '10s',
        retries: 3,
      },
    },
  },

  // Environment configurations
  environments: {
    development: {
      branch: 'develop',
      domain: 'localhost:3000',
      apiUrl: 'http://localhost:3001/api',
      database: {
        ssl: false,
        poolSize: 5,
      },
      features: {
        analytics: false,
        sentry: false,
        pwa: false,
      },
    },
    staging: {
      branch: 'staging',
      domain: 'staging.judge.ca',
      apiUrl: 'https://staging.judge.ca/api',
      database: {
        ssl: true,
        poolSize: 10,
      },
      features: {
        analytics: true,
        sentry: true,
        pwa: true,
      },
    },
    production: {
      branch: 'main',
      domain: 'judge.ca',
      apiUrl: 'https://judge.ca/api',
      database: {
        ssl: true,
        poolSize: 20,
      },
      features: {
        analytics: true,
        sentry: true,
        pwa: true,
      },
    },
  },

  // Deployment strategies
  strategies: {
    blueGreen: {
      enabled: true,
      environments: ['staging', 'production'],
      healthCheckTimeout: 300000, // 5 minutes
      rollbackOnFailure: true,
    },
    canary: {
      enabled: false,
      environments: ['production'],
      trafficPercentage: 10,
      duration: 3600000, // 1 hour
    },
    rollback: {
      enabled: true,
      keepVersions: 10,
      autoRollbackOnError: true,
    },
  },

  // Health check configuration
  healthChecks: {
    endpoints: [
      '/api/health',
      '/api/deployment/health',
    ],
    timeout: 30000,
    retries: 3,
    interval: 60000,
  },

  // Notification settings
  notifications: {
    webhook: {
      enabled: true,
      url: process.env.DEPLOYMENT_WEBHOOK_URL,
      events: ['deployment_started', 'deployment_completed', 'deployment_failed'],
    },
    email: {
      enabled: false,
      recipients: ['admin@judge.ca'],
      events: ['deployment_failed', 'rollback_triggered'],
    },
  },

  // Security settings
  security: {
    requiredRoles: ['admin', 'super_admin'],
    allowedIPs: [], // Empty means all IPs allowed
    requireApproval: {
      production: true,
      staging: false,
      development: false,
    },
  },

  // Build optimization
  build: {
    optimization: {
      bundleAnalysis: true,
      treeshaking: true,
      compression: true,
      minification: true,
    },
    caching: {
      enabled: true,
      duration: 3600, // 1 hour in seconds
      strategy: 'content-hash',
    },
  },

  // Monitoring and logging
  monitoring: {
    metrics: {
      enabled: true,
      retention: '30d',
      alertThresholds: {
        errorRate: 0.05, // 5%
        responseTime: 2000, // 2 seconds
      },
    },
    logging: {
      level: 'info',
      retention: '7d',
      destinations: ['console', 'file'],
    },
  },
};

module.exports = deploymentConfig;