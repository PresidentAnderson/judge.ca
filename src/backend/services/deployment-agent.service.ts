import { exec } from 'child_process';
import { promisify } from 'util';
import winston from 'winston';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

interface DeploymentStatus {
  id: string;
  status: 'pending' | 'building' | 'success' | 'error' | 'cancelled';
  platform: 'vercel' | 'docker' | 'manual';
  environment: 'development' | 'staging' | 'production';
  version: string;
  timestamp: Date;
  logs: string[];
  metrics?: {
    buildTime?: number;
    deployTime?: number;
    bundleSize?: number;
  };
}

interface DeploymentConfig {
  platform: 'vercel' | 'docker' | 'manual';
  environment: 'development' | 'staging' | 'production';
  branch?: string;
  autoPromote?: boolean;
  healthCheckUrl?: string;
  environmentVariables?: Record<string, string>;
}

export class BackendDeploymentAgent {
  private logger: winston.Logger;
  private deploymentHistory: Map<string, DeploymentStatus> = new Map();
  private readonly maxHistorySize = 100;

  constructor() {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      transports: [
        new winston.transports.File({ 
          filename: 'logs/deployment-error.log', 
          level: 'error' 
        }),
        new winston.transports.File({ 
          filename: 'logs/deployment.log' 
        }),
        new winston.transports.Console({
          format: winston.format.simple()
        })
      ],
    });
  }

  /**
   * Deploy backend to specified platform
   */
  async deployBackend(config: DeploymentConfig): Promise<DeploymentStatus> {
    const deploymentId = this.generateDeploymentId();
    const deployment: DeploymentStatus = {
      id: deploymentId,
      status: 'pending',
      platform: config.platform,
      environment: config.environment,
      version: await this.getCurrentVersion(),
      timestamp: new Date(),
      logs: [],
    };

    this.deploymentHistory.set(deploymentId, deployment);
    this.logger.info(`Starting backend deployment`, { deploymentId, config });

    try {
      deployment.status = 'building';
      deployment.logs.push(`[${new Date().toISOString()}] Starting deployment to ${config.platform}`);

      const startTime = Date.now();

      switch (config.platform) {
        case 'vercel':
          await this.deployToVercel(deployment, config);
          break;
        case 'docker':
          await this.deployToDocker(deployment, config);
          break;
        case 'manual':
          await this.deployManual(deployment, config);
          break;
        default:
          throw new Error(`Unsupported platform: ${config.platform}`);
      }

      deployment.metrics = {
        ...deployment.metrics,
        deployTime: Date.now() - startTime,
      };

      deployment.status = 'success';
      deployment.logs.push(`[${new Date().toISOString()}] Deployment completed successfully`);

      // Run post-deployment health check
      if (config.healthCheckUrl) {
        await this.performHealthCheck(deployment, config.healthCheckUrl);
      }

      this.logger.info(`Backend deployment completed successfully`, { deploymentId });
      
    } catch (error) {
      const err = error as Error;
      deployment.status = 'error';
      deployment.logs.push(`[${new Date().toISOString()}] Deployment failed: ${err.message}`);
      this.logger.error(`Backend deployment failed`, { deploymentId, error: err.message });
      throw error;
    }

    this.trimDeploymentHistory();
    return deployment;
  }

  /**
   * Deploy to Vercel platform
   */
  private async deployToVercel(deployment: DeploymentStatus, config: DeploymentConfig): Promise<void> {
    deployment.logs.push(`[${new Date().toISOString()}] Building application...`);
    
    // Build the application
    const buildStartTime = Date.now();
    const { stdout: buildOutput, stderr: buildError } = await execAsync('npm run build');
    
    if (buildError) {
      deployment.logs.push(`[${new Date().toISOString()}] Build warnings: ${buildError}`);
    }
    
    deployment.logs.push(`[${new Date().toISOString()}] Build output: ${buildOutput}`);
    deployment.metrics = {
      ...deployment.metrics,
      buildTime: Date.now() - buildStartTime,
    };

    // Set environment variables if provided
    if (config.environmentVariables) {
      deployment.logs.push(`[${new Date().toISOString()}] Setting environment variables...`);
      for (const [key, value] of Object.entries(config.environmentVariables)) {
        try {
          await execAsync(`npx vercel env add ${key} ${config.environment} -y`, {
            input: value,
            timeout: 30000,
          });
        } catch (error) {
          // Variable might already exist, try to update
          try {
            await execAsync(`npx vercel env rm ${key} ${config.environment} -y`);
            await execAsync(`npx vercel env add ${key} ${config.environment} -y`, {
              input: value,
              timeout: 30000,
            });
          } catch (updateError) {
            const updateErr = updateError as Error;
            deployment.logs.push(`[${new Date().toISOString()}] Warning: Could not set ${key}: ${updateErr.message}`);
          }
        }
      }
    }

    // Deploy to Vercel
    deployment.logs.push(`[${new Date().toISOString()}] Deploying to Vercel...`);
    const deployFlag = config.environment === 'production' ? '--prod' : '';
    const { stdout: deployOutput } = await execAsync(`npx vercel ${deployFlag} --yes`, {
      timeout: 600000, // 10 minutes timeout
    });

    deployment.logs.push(`[${new Date().toISOString()}] Vercel deployment output: ${deployOutput}`);

    // Extract deployment URL
    const urlMatch = deployOutput.match(/https:\/\/[^\s]+/);
    if (urlMatch) {
      deployment.logs.push(`[${new Date().toISOString()}] Deployment URL: ${urlMatch[0]}`);
    }
  }

  /**
   * Deploy to Docker platform
   */
  private async deployToDocker(deployment: DeploymentStatus, config: DeploymentConfig): Promise<void> {
    deployment.logs.push(`[${new Date().toISOString()}] Building Docker image...`);
    
    const imageName = `judge-ca:${config.environment}-${deployment.version}`;
    
    // Build Docker image
    const { stdout: buildOutput } = await execAsync(`docker build -t ${imageName} .`, {
      timeout: 900000, // 15 minutes timeout
    });
    
    deployment.logs.push(`[${new Date().toISOString()}] Docker build output: ${buildOutput}`);

    // Stop existing container if running
    try {
      await execAsync(`docker stop judge-ca-${config.environment}`);
      await execAsync(`docker rm judge-ca-${config.environment}`);
      deployment.logs.push(`[${new Date().toISOString()}] Stopped existing container`);
    } catch (error) {
      deployment.logs.push(`[${new Date().toISOString()}] No existing container to stop`);
    }

    // Run new container
    const portMapping = config.environment === 'production' ? '80:3000' : '3001:3000';
    const envVars = config.environmentVariables 
      ? Object.entries(config.environmentVariables).map(([key, value]) => `-e ${key}="${value}"`).join(' ')
      : '';

    const { stdout: runOutput } = await execAsync(
      `docker run -d --name judge-ca-${config.environment} -p ${portMapping} ${envVars} ${imageName}`,
      { timeout: 60000 }
    );

    deployment.logs.push(`[${new Date().toISOString()}] Container started: ${runOutput}`);
  }

  /**
   * Manual deployment process
   */
  private async deployManual(deployment: DeploymentStatus, config: DeploymentConfig): Promise<void> {
    deployment.logs.push(`[${new Date().toISOString()}] Starting manual deployment process...`);
    
    // Create deployment package
    const packagePath = await this.createDeploymentPackage(deployment);
    deployment.logs.push(`[${new Date().toISOString()}] Created deployment package: ${packagePath}`);

    // Generate deployment instructions
    const instructions = this.generateManualInstructions(config, packagePath);
    deployment.logs.push(`[${new Date().toISOString()}] Manual deployment instructions generated`);
    deployment.logs.push(`[${new Date().toISOString()}] Instructions: ${instructions}`);
  }

  /**
   * Create deployment package for manual deployment
   */
  private async createDeploymentPackage(deployment: DeploymentStatus): Promise<string> {
    const packageName = `judge-ca-deployment-${deployment.id}.tar.gz`;
    const packagePath = path.join(process.cwd(), 'dist', packageName);

    // Ensure dist directory exists
    await fs.mkdir(path.dirname(packagePath), { recursive: true });

    // Create tar archive
    await execAsync(`tar -czf ${packagePath} --exclude=node_modules --exclude=.git --exclude=.next .`);
    
    return packagePath;
  }

  /**
   * Generate manual deployment instructions
   */
  private generateManualInstructions(config: DeploymentConfig, packagePath: string): string {
    return `
Manual Deployment Instructions for ${config.environment}:

1. Extract the deployment package:
   tar -xzf ${packagePath}

2. Install dependencies:
   npm install

3. Set environment variables:
   ${config.environmentVariables ? 
     Object.entries(config.environmentVariables)
       .map(([key, value]) => `export ${key}="${value}"`)
       .join('\n   ') : 
     'No environment variables specified'
   }

4. Build the application:
   npm run build

5. Start the application:
   npm start

6. Verify deployment:
   curl -f ${config.healthCheckUrl || 'http://localhost:3000/api/health'} || echo "Health check failed"
`;
  }

  /**
   * Perform health check after deployment
   */
  private async performHealthCheck(deployment: DeploymentStatus, healthCheckUrl: string): Promise<void> {
    deployment.logs.push(`[${new Date().toISOString()}] Performing health check...`);
    
    const maxRetries = 5;
    const retryDelay = 10000; // 10 seconds

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const { stdout } = await execAsync(`curl -f ${healthCheckUrl}`, {
          timeout: 30000,
        });
        
        deployment.logs.push(`[${new Date().toISOString()}] Health check passed: ${stdout}`);
        return;
      } catch (error) {
        const err = error as Error;
        deployment.logs.push(`[${new Date().toISOString()}] Health check attempt ${attempt} failed: ${err.message}`);
        
        if (attempt === maxRetries) {
          throw new Error(`Health check failed after ${maxRetries} attempts`);
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }

  /**
   * Get deployment status by ID
   */
  getDeploymentStatus(deploymentId: string): DeploymentStatus | null {
    return this.deploymentHistory.get(deploymentId) || null;
  }

  /**
   * Get all deployment history
   */
  getDeploymentHistory(): DeploymentStatus[] {
    return Array.from(this.deploymentHistory.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Cancel a pending or building deployment
   */
  async cancelDeployment(deploymentId: string): Promise<boolean> {
    const deployment = this.deploymentHistory.get(deploymentId);
    
    if (!deployment || !['pending', 'building'].includes(deployment.status)) {
      return false;
    }

    deployment.status = 'cancelled';
    deployment.logs.push(`[${new Date().toISOString()}] Deployment cancelled by user`);
    
    this.logger.info(`Deployment cancelled`, { deploymentId });
    return true;
  }

  /**
   * Rollback to previous deployment
   */
  async rollbackDeployment(targetDeploymentId: string, config: DeploymentConfig): Promise<DeploymentStatus> {
    const targetDeployment = this.deploymentHistory.get(targetDeploymentId);
    
    if (!targetDeployment || targetDeployment.status !== 'success') {
      throw new Error(`Target deployment ${targetDeploymentId} not found or not successful`);
    }

    this.logger.info(`Starting rollback to deployment ${targetDeploymentId}`);

    // Create new deployment with rollback flag
    const rollbackConfig = {
      ...config,
      environmentVariables: {
        ...config.environmentVariables,
        ROLLBACK_TO: targetDeployment.version,
      },
    };

    return this.deployBackend(rollbackConfig);
  }

  /**
   * Generate unique deployment ID
   */
  private generateDeploymentId(): string {
    return `deploy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get current version from package.json or git
   */
  private async getCurrentVersion(): Promise<string> {
    try {
      const packageJson = JSON.parse(await fs.readFile('package.json', 'utf-8'));
      return packageJson.version || '1.0.0';
    } catch (error) {
      try {
        const { stdout } = await execAsync('git rev-parse --short HEAD');
        return stdout.trim();
      } catch (gitError) {
        return '1.0.0';
      }
    }
  }

  /**
   * Trim deployment history to max size
   */
  private trimDeploymentHistory(): void {
    if (this.deploymentHistory.size > this.maxHistorySize) {
      const sorted = Array.from(this.deploymentHistory.entries())
        .sort((a, b) => b[1].timestamp.getTime() - a[1].timestamp.getTime());
      
      this.deploymentHistory.clear();
      sorted.slice(0, this.maxHistorySize).forEach(([id, deployment]) => {
        this.deploymentHistory.set(id, deployment);
      });
    }
  }

  /**
   * Get deployment metrics and statistics
   */
  getDeploymentMetrics(): {
    totalDeployments: number;
    successRate: number;
    averageBuildTime: number;
    averageDeployTime: number;
    platformBreakdown: Record<string, number>;
    environmentBreakdown: Record<string, number>;
  } {
    const deployments = Array.from(this.deploymentHistory.values());
    
    const successful = deployments.filter(d => d.status === 'success').length;
    const buildTimes = deployments
      .filter(d => d.metrics?.buildTime)
      .map(d => d.metrics!.buildTime!);
    const deployTimes = deployments
      .filter(d => d.metrics?.deployTime)
      .map(d => d.metrics!.deployTime!);

    const platformBreakdown = deployments.reduce((acc, d) => {
      acc[d.platform] = (acc[d.platform] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const environmentBreakdown = deployments.reduce((acc, d) => {
      acc[d.environment] = (acc[d.environment] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalDeployments: deployments.length,
      successRate: deployments.length > 0 ? (successful / deployments.length) * 100 : 0,
      averageBuildTime: buildTimes.length > 0 ? buildTimes.reduce((a, b) => a + b, 0) / buildTimes.length : 0,
      averageDeployTime: deployTimes.length > 0 ? deployTimes.reduce((a, b) => a + b, 0) / deployTimes.length : 0,
      platformBreakdown,
      environmentBreakdown,
    };
  }
}

// Export singleton instance
export const backendDeploymentAgent = new BackendDeploymentAgent();