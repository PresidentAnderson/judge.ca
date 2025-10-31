import { Pool, PoolClient } from 'pg';
import winston from 'winston';
import fs from 'fs/promises';
import path from 'path';

interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl: boolean;
  poolSize: {
    min: number;
    max: number;
  };
  connectionTimeout: number;
  idleTimeout: number;
  maxRetries: number;
}

interface DatabaseHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  activeConnections: number;
  totalConnections: number;
  errors: string[];
  lastChecked: Date;
}

interface DatabaseMetrics {
  timestamp: Date;
  activeConnections: number;
  idleConnections: number;
  totalConnections: number;
  queryCount: number;
  averageQueryTime: number;
  slowQueries: Array<{
    query: string;
    duration: number;
    timestamp: Date;
  }>;
}

interface MigrationStatus {
  id: string;
  name: string;
  executed: boolean;
  executedAt?: Date;
  batch?: number;
  error?: string;
}

interface BackupInfo {
  id: string;
  filename: string;
  size: number;
  timestamp: Date;
  type: 'full' | 'incremental';
  status: 'pending' | 'running' | 'completed' | 'failed';
  location: string;
}

export class DatabaseConfigurationAgent {
  private logger: winston.Logger;
  private pools: Map<string, Pool> = new Map();
  private metrics: DatabaseMetrics[] = [];
  private readonly maxMetricsHistory = 1000;
  private healthCheckInterval?: NodeJS.Timeout;

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
          filename: 'logs/database-error.log', 
          level: 'error' 
        }),
        new winston.transports.File({ 
          filename: 'logs/database.log' 
        }),
        new winston.transports.Console({
          format: winston.format.simple()
        })
      ],
    });

    this.startHealthMonitoring();
  }

  /**
   * Initialize database connection with configuration
   */
  async initializeDatabase(environment: string, config: DatabaseConfig): Promise<Pool> {
    try {
      this.logger.info(`Initializing database connection for ${environment}`, { config: { ...config, password: '***' } });

      const poolConfig = {
        host: config.host,
        port: config.port,
        database: config.database,
        user: config.username,
        password: config.password,
        ssl: config.ssl ? { rejectUnauthorized: false } : false,
        min: config.poolSize.min,
        max: config.poolSize.max,
        connectionTimeoutMillis: config.connectionTimeout,
        idleTimeoutMillis: config.idleTimeout,
        query_timeout: 30000,
        statement_timeout: 30000,
        keepAlive: true,
        keepAliveInitialDelayMillis: 10000,
      };

      const pool = new Pool(poolConfig);

      // Test connection
      const client = await pool.connect();
      await client.query('SELECT NOW()');
      client.release();

      this.pools.set(environment, pool);
      this.logger.info(`Database connection established for ${environment}`);

      // Set up connection event handlers
      pool.on('connect', () => {
        this.logger.debug('Database client connected');
      });

      pool.on('error', (err) => {
        this.logger.error('Database pool error', { error: err.message });
      });

      return pool;
    } catch (error) {
      this.logger.error(`Failed to initialize database for ${environment}`, { error: error.message });
      throw error;
    }
  }

  /**
   * Get database connection pool
   */
  getPool(environment: string = 'production'): Pool | null {
    return this.pools.get(environment) || null;
  }

  /**
   * Execute database query with monitoring
   */
  async executeQuery<T = any>(
    environment: string, 
    query: string, 
    params: any[] = []
  ): Promise<T[]> {
    const pool = this.getPool(environment);
    if (!pool) {
      throw new Error(`No database connection found for environment: ${environment}`);
    }

    const startTime = Date.now();
    let client: PoolClient | null = null;

    try {
      client = await pool.connect();
      const result = await client.query(query, params);
      const duration = Date.now() - startTime;

      // Log slow queries
      if (duration > 1000) {
        this.logger.warn('Slow query detected', {
          query: query.substring(0, 200),
          duration,
          environment,
        });
      }

      this.updateMetrics(environment, duration);
      return result.rows;
    } catch (error) {
      this.logger.error('Database query failed', {
        query: query.substring(0, 200),
        error: error.message,
        environment,
      });
      throw error;
    } finally {
      if (client) {
        client.release();
      }
    }
  }

  /**
   * Run database migrations
   */
  async runMigrations(environment: string): Promise<MigrationStatus[]> {
    try {
      this.logger.info(`Running migrations for ${environment}`);

      const pool = this.getPool(environment);
      if (!pool) {
        throw new Error(`No database connection found for environment: ${environment}`);
      }

      // Ensure migrations table exists
      await this.executeQuery(environment, `
        CREATE TABLE IF NOT EXISTS knex_migrations (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          batch INTEGER NOT NULL,
          migration_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Get pending migrations
      const migrationFiles = await this.getMigrationFiles();
      const executedMigrations = await this.executeQuery<{name: string, batch: number}>(
        environment,
        'SELECT name, batch FROM knex_migrations ORDER BY id'
      );

      const executedNames = new Set(executedMigrations.map(m => m.name));
      const pendingMigrations = migrationFiles.filter(file => !executedNames.has(file));

      const migrationStatuses: MigrationStatus[] = [];
      const currentBatch = Math.max(...executedMigrations.map(m => m.batch), 0) + 1;

      // Execute pending migrations
      for (const migrationFile of pendingMigrations) {
        try {
          const migrationPath = path.join(process.cwd(), 'database', 'migrations', migrationFile);
          const migrationSql = await fs.readFile(migrationPath, 'utf-8');
          
          await this.executeQuery(environment, migrationSql);
          await this.executeQuery(environment, 
            'INSERT INTO knex_migrations (name, batch) VALUES ($1, $2)',
            [migrationFile, currentBatch]
          );

          migrationStatuses.push({
            id: migrationFile,
            name: migrationFile,
            executed: true,
            executedAt: new Date(),
            batch: currentBatch,
          });

          this.logger.info(`Migration executed: ${migrationFile}`);
        } catch (error) {
          migrationStatuses.push({
            id: migrationFile,
            name: migrationFile,
            executed: false,
            error: error.message,
          });

          this.logger.error(`Migration failed: ${migrationFile}`, { error: error.message });
          break; // Stop on first failure
        }
      }

      return migrationStatuses;
    } catch (error) {
      this.logger.error('Migration process failed', { error: error.message, environment });
      throw error;
    }
  }

  /**
   * Check database health
   */
  async checkHealth(environment: string = 'production'): Promise<DatabaseHealth> {
    const startTime = Date.now();
    const health: DatabaseHealth = {
      status: 'unhealthy',
      responseTime: 0,
      activeConnections: 0,
      totalConnections: 0,
      errors: [],
      lastChecked: new Date(),
    };

    try {
      const pool = this.getPool(environment);
      if (!pool) {
        health.errors.push(`No connection pool found for ${environment}`);
        return health;
      }

      // Test basic connectivity
      const result = await this.executeQuery(environment, 'SELECT 1 as test, NOW() as timestamp');
      health.responseTime = Date.now() - startTime;

      // Get connection stats
      const stats = await this.executeQuery<{
        active: number;
        idle: number;
        waiting: number;
      }>(environment, `
        SELECT 
          (SELECT count(*) FROM pg_stat_activity WHERE state = 'active') as active,
          (SELECT count(*) FROM pg_stat_activity WHERE state = 'idle') as idle,
          (SELECT count(*) FROM pg_stat_activity WHERE wait_event_type IS NOT NULL) as waiting
      `);

      if (stats.length > 0) {
        health.activeConnections = stats[0].active;
        health.totalConnections = stats[0].active + stats[0].idle;
      }

      // Determine health status
      if (health.responseTime < 100) {
        health.status = 'healthy';
      } else if (health.responseTime < 1000) {
        health.status = 'degraded';
        health.errors.push('Slow response time');
      } else {
        health.status = 'unhealthy';
        health.errors.push('Very slow response time');
      }

      // Check for too many connections
      if (health.activeConnections > 80) {
        health.status = 'degraded';
        health.errors.push('High connection usage');
      }

    } catch (error) {
      health.errors.push(error.message);
      health.responseTime = Date.now() - startTime;
      this.logger.error('Database health check failed', { error: error.message, environment });
    }

    return health;
  }

  /**
   * Create database backup
   */
  async createBackup(environment: string, type: 'full' | 'incremental' = 'full'): Promise<BackupInfo> {
    const backupId = `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date();
    const filename = `judge_ca_${environment}_${type}_${timestamp.toISOString().split('T')[0]}_${backupId}.sql`;
    const backupPath = path.join(process.cwd(), 'backups', filename);

    const backup: BackupInfo = {
      id: backupId,
      filename,
      size: 0,
      timestamp,
      type,
      status: 'pending',
      location: backupPath,
    };

    try {
      this.logger.info(`Creating ${type} backup for ${environment}`, { backupId });
      backup.status = 'running';

      // Ensure backup directory exists
      await fs.mkdir(path.dirname(backupPath), { recursive: true });

      const config = await this.getDatabaseConfig(environment);
      
      // Use pg_dump for backup
      const { exec } = require('child_process');
      const { promisify } = require('util');
      const execAsync = promisify(exec);

      const dumpCommand = type === 'full' 
        ? `pg_dump -h ${config.host} -p ${config.port} -U ${config.username} -d ${config.database} -f ${backupPath}`
        : `pg_dump -h ${config.host} -p ${config.port} -U ${config.username} -d ${config.database} --incremental -f ${backupPath}`;

      await execAsync(dumpCommand, {
        env: { ...process.env, PGPASSWORD: config.password },
        timeout: 600000, // 10 minutes
      });

      // Get file size
      const stats = await fs.stat(backupPath);
      backup.size = stats.size;
      backup.status = 'completed';

      this.logger.info(`Backup completed: ${filename}`, { 
        backupId, 
        size: backup.size,
        duration: Date.now() - timestamp.getTime() 
      });

    } catch (error) {
      backup.status = 'failed';
      this.logger.error(`Backup failed: ${backupId}`, { error: error.message });
      throw error;
    }

    return backup;
  }

  /**
   * Restore database from backup
   */
  async restoreBackup(environment: string, backupPath: string): Promise<void> {
    try {
      this.logger.info(`Restoring database from backup: ${backupPath}`, { environment });

      const config = await this.getDatabaseConfig(environment);
      
      const { exec } = require('child_process');
      const { promisify } = require('util');
      const execAsync = promisify(exec);

      const restoreCommand = `psql -h ${config.host} -p ${config.port} -U ${config.username} -d ${config.database} -f ${backupPath}`;

      await execAsync(restoreCommand, {
        env: { ...process.env, PGPASSWORD: config.password },
        timeout: 600000, // 10 minutes
      });

      this.logger.info(`Database restored successfully from: ${backupPath}`);
    } catch (error) {
      this.logger.error(`Database restore failed`, { error: error.message, backupPath });
      throw error;
    }
  }

  /**
   * Optimize database performance
   */
  async optimizeDatabase(environment: string): Promise<{
    vacuumResults: string[];
    reindexResults: string[];
    statisticsUpdated: boolean;
  }> {
    try {
      this.logger.info(`Optimizing database for ${environment}`);

      const results = {
        vacuumResults: [],
        reindexResults: [],
        statisticsUpdated: false,
      };

      // Get all tables
      const tables = await this.executeQuery<{table_name: string}>(
        environment,
        `SELECT table_name FROM information_schema.tables 
         WHERE table_schema = 'public' AND table_type = 'BASE TABLE'`
      );

      // VACUUM and ANALYZE tables
      for (const table of tables) {
        try {
          await this.executeQuery(environment, `VACUUM ANALYZE ${table.table_name}`);
          results.vacuumResults.push(`VACUUM ANALYZE completed for ${table.table_name}`);
        } catch (error) {
          results.vacuumResults.push(`VACUUM ANALYZE failed for ${table.table_name}: ${error.message}`);
        }
      }

      // REINDEX tables with indexes
      const indexes = await this.executeQuery<{indexname: string}>(
        environment,
        `SELECT indexname FROM pg_indexes WHERE schemaname = 'public'`
      );

      for (const index of indexes) {
        try {
          await this.executeQuery(environment, `REINDEX INDEX ${index.indexname}`);
          results.reindexResults.push(`REINDEX completed for ${index.indexname}`);
        } catch (error) {
          results.reindexResults.push(`REINDEX failed for ${index.indexname}: ${error.message}`);
        }
      }

      // Update table statistics
      try {
        await this.executeQuery(environment, 'ANALYZE');
        results.statisticsUpdated = true;
      } catch (error) {
        this.logger.error('Failed to update statistics', { error: error.message });
      }

      this.logger.info(`Database optimization completed for ${environment}`, results);
      return results;
    } catch (error) {
      this.logger.error('Database optimization failed', { error: error.message, environment });
      throw error;
    }
  }

  /**
   * Get database metrics
   */
  getDatabaseMetrics(environment: string, hours: number = 24): DatabaseMetrics[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.metrics.filter(metric => metric.timestamp >= cutoff);
  }

  /**
   * Close database connections
   */
  async closeConnections(environment?: string): Promise<void> {
    if (environment) {
      const pool = this.pools.get(environment);
      if (pool) {
        await pool.end();
        this.pools.delete(environment);
        this.logger.info(`Database connection closed for ${environment}`);
      }
    } else {
      // Close all connections
      for (const [env, pool] of this.pools) {
        await pool.end();
        this.logger.info(`Database connection closed for ${env}`);
      }
      this.pools.clear();
    }

    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
  }

  /**
   * Start health monitoring
   */
  private startHealthMonitoring(): void {
    this.healthCheckInterval = setInterval(async () => {
      for (const environment of this.pools.keys()) {
        try {
          await this.checkHealth(environment);
        } catch (error) {
          this.logger.error(`Health check failed for ${environment}`, { error: error.message });
        }
      }
    }, 30000); // Check every 30 seconds
  }

  /**
   * Update metrics
   */
  private updateMetrics(environment: string, queryDuration: number): void {
    const pool = this.pools.get(environment);
    if (!pool) return;

    const metric: DatabaseMetrics = {
      timestamp: new Date(),
      activeConnections: (pool as any).idleCount || 0,
      idleConnections: (pool as any).totalCount - (pool as any).idleCount || 0,
      totalConnections: (pool as any).totalCount || 0,
      queryCount: 1,
      averageQueryTime: queryDuration,
      slowQueries: queryDuration > 1000 ? [{
        query: 'Query details not tracked',
        duration: queryDuration,
        timestamp: new Date(),
      }] : [],
    };

    this.metrics.push(metric);

    // Trim metrics history
    if (this.metrics.length > this.maxMetricsHistory) {
      this.metrics = this.metrics.slice(-this.maxMetricsHistory);
    }
  }

  /**
   * Get migration files
   */
  private async getMigrationFiles(): Promise<string[]> {
    try {
      const migrationsDir = path.join(process.cwd(), 'database', 'migrations');
      const files = await fs.readdir(migrationsDir);
      return files.filter(file => file.endsWith('.sql')).sort();
    } catch (error) {
      this.logger.error('Failed to read migration files', { error: error.message });
      return [];
    }
  }

  /**
   * Get database configuration for environment
   */
  private async getDatabaseConfig(environment: string): Promise<DatabaseConfig> {
    // This would typically come from environment variables or config files
    return {
      host: process.env[`${environment.toUpperCase()}_DB_HOST`] || 'localhost',
      port: parseInt(process.env[`${environment.toUpperCase()}_DB_PORT`] || '5432'),
      database: process.env[`${environment.toUpperCase()}_DB_NAME`] || 'judge_ca',
      username: process.env[`${environment.toUpperCase()}_DB_USER`] || 'postgres',
      password: process.env[`${environment.toUpperCase()}_DB_PASSWORD`] || '',
      ssl: process.env[`${environment.toUpperCase()}_DB_SSL`] === 'true',
      poolSize: {
        min: parseInt(process.env[`${environment.toUpperCase()}_DB_POOL_MIN`] || '2'),
        max: parseInt(process.env[`${environment.toUpperCase()}_DB_POOL_MAX`] || '10'),
      },
      connectionTimeout: parseInt(process.env[`${environment.toUpperCase()}_DB_TIMEOUT`] || '30000'),
      idleTimeout: parseInt(process.env[`${environment.toUpperCase()}_DB_IDLE_TIMEOUT`] || '10000'),
      maxRetries: parseInt(process.env[`${environment.toUpperCase()}_DB_MAX_RETRIES`] || '3'),
    };
  }
}

// Export singleton instance
export const databaseConfigurationAgent = new DatabaseConfigurationAgent();