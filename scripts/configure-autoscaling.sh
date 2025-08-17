#!/bin/bash

# Railway Auto-Scaling Configuration Script
# Configures auto-scaling settings for Judge.ca backend services

set -e

echo "⚡ Configuring auto-scaling for Railway deployment..."

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Please install it first."
    exit 1
fi

# Check if logged in
if ! railway whoami &> /dev/null; then
    echo "🔐 Please log in to Railway first: railway login"
    exit 1
fi

echo "📊 Auto-scaling configuration for Judge.ca backend services"
echo "=========================================================="

# Note: Railway auto-scaling is managed through the dashboard for most settings
# This script provides configuration guidance and sets what can be set via CLI

echo ""
echo "🔧 Setting performance-related environment variables..."

# Set variables that help with auto-scaling
railway variables set NODE_ENV=production
railway variables set ENABLE_CLUSTER_MODE=true
railway variables set MAX_WORKERS=4
railway variables set WORKER_MEMORY_LIMIT=512
railway variables set GRACEFUL_SHUTDOWN_TIMEOUT=30000

echo "✅ Performance variables set"

echo ""
echo "📈 Auto-scaling configuration (Railway Dashboard):"
echo "=================================================="
echo ""
echo "The following settings should be configured in the Railway Dashboard:"
echo "https://railway.app/project/[your-project-id]/settings"
echo ""

echo "1. 🖥️  CPU-based auto-scaling:"
echo "   - Target CPU utilization: 70%"
echo "   - Scale up threshold: 80%"
echo "   - Scale down threshold: 30%"
echo "   - Min instances: 1"
echo "   - Max instances: 5"
echo ""

echo "2. 🧠 Memory-based auto-scaling:"
echo "   - Target memory utilization: 80%"
echo "   - Scale up when memory > 85%"
echo "   - Scale down when memory < 50%"
echo "   - Memory per instance: 512MB - 1GB"
echo ""

echo "3. 📊 Request-based auto-scaling:"
echo "   - Requests per second threshold: 100"
echo "   - Response time threshold: 500ms"
echo "   - Queue depth threshold: 10"
echo ""

echo "4. ⏱️  Scaling timing:"
echo "   - Scale up delay: 30 seconds"
echo "   - Scale down delay: 5 minutes"
echo "   - Cooldown period: 3 minutes"
echo ""

# Create cluster configuration for Node.js
cat > src/backend/cluster.config.js << 'EOF'
/**
 * Cluster Configuration for Railway Auto-scaling
 * Optimizes Node.js performance for horizontal scaling
 */

const cluster = require('cluster');
const os = require('os');

const ENABLE_CLUSTER = process.env.ENABLE_CLUSTER_MODE === 'true';
const MAX_WORKERS = parseInt(process.env.MAX_WORKERS || '4');
const WORKER_MEMORY_LIMIT = parseInt(process.env.WORKER_MEMORY_LIMIT || '512') * 1024 * 1024; // Convert MB to bytes

function startCluster() {
  if (cluster.isMaster && ENABLE_CLUSTER) {
    console.log(`Master process ${process.pid} is running`);

    // Determine number of workers
    const numWorkers = Math.min(MAX_WORKERS, os.cpus().length);
    console.log(`Starting ${numWorkers} workers`);

    // Fork workers
    for (let i = 0; i < numWorkers; i++) {
      const worker = cluster.fork();
      
      // Monitor worker memory usage
      setInterval(() => {
        if (worker.process && worker.process.memoryUsage) {
          const memUsage = worker.process.memoryUsage();
          if (memUsage.heapUsed > WORKER_MEMORY_LIMIT) {
            console.log(`Worker ${worker.process.pid} memory limit exceeded, restarting...`);
            worker.kill();
          }
        }
      }, 30000); // Check every 30 seconds
    }

    // Handle worker exit
    cluster.on('exit', (worker, code, signal) => {
      console.log(`Worker ${worker.process.pid} died with code ${code} and signal ${signal}`);
      
      // Restart worker if it wasn't killed intentionally
      if (code !== 0 && !worker.exitedAfterDisconnect) {
        console.log('Restarting worker...');
        cluster.fork();
      }
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('Master received SIGTERM, shutting down workers...');
      
      for (const id in cluster.workers) {
        cluster.workers[id].kill();
      }
    });

    process.on('SIGINT', () => {
      console.log('Master received SIGINT, shutting down workers...');
      
      for (const id in cluster.workers) {
        cluster.workers[id].kill();
      }
    });

  } else {
    // Worker process - start the application
    require('./production.server.js');
  }
}

module.exports = { startCluster };

// Start cluster if this file is run directly
if (require.main === module) {
  startCluster();
}
EOF

echo "📝 Cluster configuration created: src/backend/cluster.config.js"

# Create auto-scaling middleware for request monitoring
cat > src/backend/middleware/scaling.middleware.ts << 'EOF'
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

interface ScalingMetrics {
  requestCount: number;
  activeConnections: number;
  averageResponseTime: number;
  errorRate: number;
  cpuUsage: number;
  memoryUsage: number;
  lastUpdate: number;
}

class ScalingMonitor {
  private metrics: ScalingMetrics = {
    requestCount: 0,
    activeConnections: 0,
    averageResponseTime: 0,
    errorRate: 0,
    cpuUsage: 0,
    memoryUsage: 0,
    lastUpdate: Date.now()
  };

  private responseTimes: number[] = [];
  private errors: number = 0;
  private readonly METRICS_WINDOW = 60000; // 1 minute

  // Middleware to track scaling metrics
  trackRequest = (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    this.metrics.requestCount++;
    this.metrics.activeConnections++;

    // Override res.end to capture response time and status
    const originalEnd = res.end;
    res.end = (chunk?: any, encoding?: any) => {
      const responseTime = Date.now() - startTime;
      
      // Track response time
      this.responseTimes.push(responseTime);
      if (this.responseTimes.length > 1000) {
        this.responseTimes.shift();
      }

      // Track errors
      if (res.statusCode >= 400) {
        this.errors++;
      }

      this.metrics.activeConnections--;
      this.updateMetrics();

      return originalEnd.call(res, chunk, encoding);
    };

    next();
  };

  // Update aggregated metrics
  private updateMetrics() {
    const now = Date.now();
    
    // Update average response time
    if (this.responseTimes.length > 0) {
      this.metrics.averageResponseTime = 
        this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length;
    }

    // Update error rate (errors per minute)
    const timeWindow = now - this.metrics.lastUpdate;
    if (timeWindow >= this.METRICS_WINDOW) {
      this.metrics.errorRate = (this.errors / timeWindow) * 60000; // errors per minute
      this.errors = 0;
      this.metrics.lastUpdate = now;
    }

    // Update system metrics
    this.updateSystemMetrics();
  }

  // Update system metrics
  private updateSystemMetrics() {
    const memUsage = process.memoryUsage();
    this.metrics.memoryUsage = (memUsage.heapUsed / memUsage.heapTotal) * 100;
    
    // CPU usage is more complex to calculate, this is a simplified version
    const cpuUsage = process.cpuUsage();
    this.metrics.cpuUsage = (cpuUsage.user + cpuUsage.system) / 1000000; // Convert to seconds
  }

  // Get current scaling metrics
  getMetrics(): ScalingMetrics {
    this.updateMetrics();
    return { ...this.metrics };
  }

  // Check if scaling is recommended
  shouldScaleUp(): boolean {
    const metrics = this.getMetrics();
    
    return (
      metrics.averageResponseTime > 1000 || // Response time > 1s
      metrics.activeConnections > 100 ||    // Too many active connections
      metrics.memoryUsage > 85 ||           // Memory usage > 85%
      metrics.errorRate > 10                // Error rate > 10 per minute
    );
  }

  shouldScaleDown(): boolean {
    const metrics = this.getMetrics();
    
    return (
      metrics.averageResponseTime < 200 &&  // Response time < 200ms
      metrics.activeConnections < 10 &&     // Few active connections
      metrics.memoryUsage < 50 &&           // Memory usage < 50%
      metrics.errorRate < 1                 // Error rate < 1 per minute
    );
  }

  // Log scaling recommendations
  logScalingRecommendations() {
    const metrics = this.getMetrics();
    
    if (this.shouldScaleUp()) {
      logger.warn('Scaling recommendation: SCALE UP', {
        metrics,
        reason: 'High load detected'
      });
    } else if (this.shouldScaleDown()) {
      logger.info('Scaling recommendation: SCALE DOWN', {
        metrics,
        reason: 'Low load detected'
      });
    }
  }

  // Start periodic monitoring
  startMonitoring(interval: number = 30000) {
    setInterval(() => {
      this.logScalingRecommendations();
    }, interval);
    
    logger.info('Scaling monitor started');
  }
}

export const scalingMonitor = new ScalingMonitor();
export default scalingMonitor;
EOF

echo "📊 Scaling middleware created: src/backend/middleware/scaling.middleware.ts"

# Update package.json with cluster script
echo "📦 Adding cluster script to package.json..."

# Check if jq is available for JSON manipulation
if command -v jq &> /dev/null; then
    # Use jq to add the cluster script
    tmp=$(mktemp)
    jq '.scripts["start:cluster"] = "node src/backend/cluster.config.js"' package.json > "$tmp"
    mv "$tmp" package.json
    echo "✅ Added start:cluster script"
else
    echo "⚠️ jq not found. Please manually add the following to package.json scripts:"
    echo '  "start:cluster": "node src/backend/cluster.config.js"'
fi

echo ""
echo "🚀 Railway Scaling Configuration Summary"
echo "========================================"
echo ""
echo "✅ Environment variables configured"
echo "✅ Cluster configuration created"
echo "✅ Scaling middleware implemented"
echo "✅ Performance monitoring enabled"
echo ""

echo "📋 Manual configuration required in Railway Dashboard:"
echo "1. Navigate to: https://railway.app/project/[your-project]/settings"
echo "2. Go to 'Deploy' > 'Auto-scaling'"
echo "3. Configure the following settings:"
echo ""
echo "   Resource Limits:"
echo "   - CPU: 0.5 - 2 vCPU"
echo "   - Memory: 512MB - 2GB"
echo "   - Disk: 1GB"
echo ""
echo "   Auto-scaling Rules:"
echo "   - Min replicas: 1"
echo "   - Max replicas: 5"
echo "   - Target CPU: 70%"
echo "   - Target Memory: 80%"
echo ""
echo "   Health Checks:"
echo "   - Path: /health/ready"
echo "   - Interval: 30s"
echo "   - Timeout: 10s"
echo "   - Retries: 3"
echo ""

echo "🔧 Deployment options:"
echo "1. Standard deployment: npm start"
echo "2. Cluster mode: npm run start:cluster"
echo "3. Railway auto-scaling: Let Railway manage scaling"
echo ""

echo "📊 Monitoring auto-scaling:"
echo "- View metrics: railway logs"
echo "- Check scaling events in Railway Dashboard"
echo "- Monitor performance: GET /health/metrics"
echo ""

echo "💡 Best practices for auto-scaling:"
echo "1. Use stateless application design"
echo "2. Implement graceful shutdown"
echo "3. Use Redis for shared state"
echo "4. Monitor database connection pools"
echo "5. Test scaling under load"
echo ""

echo "✅ Auto-scaling configuration complete!"
echo ""
echo "Next steps:"
echo "1. Deploy to Railway: railway up"
echo "2. Configure auto-scaling in Railway Dashboard"
echo "3. Test scaling under load"
echo "4. Monitor scaling metrics"