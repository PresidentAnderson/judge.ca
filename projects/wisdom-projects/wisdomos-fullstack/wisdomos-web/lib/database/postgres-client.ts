/**
 * PostgreSQL Database Client for WisdomOS Web
 * 
 * This module provides a PostgreSQL client using the standard pg library
 * for direct database access with the Neon PostgreSQL connection.
 */

import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';

// Database configuration
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Required for Neon
  },
  max: 20, // Maximum number of clients in pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Handle pool errors
pool.on('error', (err) => {
  console.error('PostgreSQL pool error:', err);
});

export interface DatabaseClient {
  query<T extends QueryResultRow = any>(text: string, params?: any[]): Promise<QueryResult<T>>;
  getClient(): Promise<PoolClient>;
  end(): Promise<void>;
}

class PostgresClient implements DatabaseClient {
  /**
   * Execute a query with optional parameters
   */
  async query<T extends QueryResultRow = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
    const start = Date.now();
    
    try {
      const result = await pool.query<T>(text, params);
      const duration = Date.now() - start;
      
      // Log slow queries (> 100ms)
      if (duration > 100) {
        console.warn(`Slow query (${duration}ms):`, text);
      }
      
      return result;
    } catch (error) {
      console.error('Database query error:', {
        query: text,
        params,
        error: error instanceof Error ? error.message : error,
      });
      throw error;
    }
  }

  /**
   * Get a client from the pool for transactions
   */
  async getClient(): Promise<PoolClient> {
    return pool.connect();
  }

  /**
   * Close the connection pool
   */
  async end(): Promise<void> {
    await pool.end();
  }

  /**
   * Test database connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const result = await this.query('SELECT NOW() as timestamp, version() as version');
      console.log('Database connected successfully:', {
        timestamp: result.rows[0]?.timestamp,
        version: result.rows[0]?.version?.substring(0, 50) + '...',
      });
      return true;
    } catch (error) {
      console.error('Database connection test failed:', error);
      return false;
    }
  }

  /**
   * Execute a transaction
   */
  async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.getClient();
    
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Create database tables if they don't exist
   */
  async initializeTables(): Promise<void> {
    const queries = [
      // Users table
      `CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255),
        avatar_url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        last_login TIMESTAMP WITH TIME ZONE,
        is_active BOOLEAN DEFAULT TRUE
      )`,

      // Life Areas table
      `CREATE TABLE IF NOT EXISTS life_areas (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        color VARCHAR(7) DEFAULT '#3B82F6',
        icon VARCHAR(50),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,

      // Journal Entries table
      `CREATE TABLE IF NOT EXISTS journal_entries (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        mood_rating INTEGER CHECK (mood_rating >= 1 AND mood_rating <= 10),
        life_area_id UUID REFERENCES life_areas(id) ON DELETE SET NULL,
        tags TEXT[],
        is_private BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,

      // Habits table
      `CREATE TABLE IF NOT EXISTS habits (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        life_area_id UUID REFERENCES life_areas(id) ON DELETE SET NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        frequency VARCHAR(20) DEFAULT 'daily' CHECK (frequency IN ('daily', 'weekly', 'monthly')),
        target_value INTEGER DEFAULT 1,
        unit VARCHAR(50),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,

      // Habit Tracking table
      `CREATE TABLE IF NOT EXISTS habit_tracking (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        value INTEGER NOT NULL DEFAULT 1,
        notes TEXT,
        tracked_date DATE NOT NULL DEFAULT CURRENT_DATE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(habit_id, tracked_date)
      )`,

      // Indexes for performance
      `CREATE INDEX IF NOT EXISTS idx_journal_entries_user_id ON journal_entries(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_journal_entries_created_at ON journal_entries(created_at DESC)`,
      `CREATE INDEX IF NOT EXISTS idx_habits_user_id ON habits(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_habit_tracking_habit_id ON habit_tracking(habit_id)`,
      `CREATE INDEX IF NOT EXISTS idx_habit_tracking_date ON habit_tracking(tracked_date DESC)`,
      `CREATE INDEX IF NOT EXISTS idx_life_areas_user_id ON life_areas(user_id)`,

      // Updated at triggers
      `CREATE OR REPLACE FUNCTION update_updated_at_column()
       RETURNS TRIGGER AS $$
       BEGIN
         NEW.updated_at = NOW();
         RETURN NEW;
       END;
       $$ language 'plpgsql'`,

      `DROP TRIGGER IF EXISTS update_users_updated_at ON users`,
      `CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`,

      `DROP TRIGGER IF EXISTS update_life_areas_updated_at ON life_areas`,
      `CREATE TRIGGER update_life_areas_updated_at BEFORE UPDATE ON life_areas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`,

      `DROP TRIGGER IF EXISTS update_journal_entries_updated_at ON journal_entries`,
      `CREATE TRIGGER update_journal_entries_updated_at BEFORE UPDATE ON journal_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`,

      `DROP TRIGGER IF EXISTS update_habits_updated_at ON habits`,
      `CREATE TRIGGER update_habits_updated_at BEFORE UPDATE ON habits FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`,
    ];

    try {
      for (const query of queries) {
        await this.query(query);
      }
      console.log('Database tables initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database tables:', error);
      throw error;
    }
  }

  /**
   * Get database statistics
   */
  async getStats(): Promise<Record<string, number>> {
    try {
      const [users, journals, habits, lifeAreas] = await Promise.all([
        this.query('SELECT COUNT(*) FROM users'),
        this.query('SELECT COUNT(*) FROM journal_entries'),
        this.query('SELECT COUNT(*) FROM habits'),
        this.query('SELECT COUNT(*) FROM life_areas'),
      ]);

      return {
        users: parseInt(users.rows[0].count),
        journalEntries: parseInt(journals.rows[0].count),
        habits: parseInt(habits.rows[0].count),
        lifeAreas: parseInt(lifeAreas.rows[0].count),
      };
    } catch (error) {
      console.error('Failed to get database stats:', error);
      return {};
    }
  }
}

// Export singleton instance
export const db = new PostgresClient();

// Helper functions for common operations
export const dbHelpers = {
  /**
   * Find user by email
   */
  async findUserByEmail(email: string) {
    const result = await db.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0] || null;
  },

  /**
   * Create or update user
   */
  async upsertUser(userData: {
    email: string;
    name?: string;
    avatar_url?: string;
  }) {
    const result = await db.query(`
      INSERT INTO users (email, name, avatar_url, last_login)
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT (email) 
      DO UPDATE SET 
        name = COALESCE($2, users.name),
        avatar_url = COALESCE($3, users.avatar_url),
        last_login = NOW(),
        updated_at = NOW()
      RETURNING *
    `, [userData.email, userData.name, userData.avatar_url]);
    
    return result.rows[0];
  },

  /**
   * Get user's journal entries with pagination
   */
  async getUserJournalEntries(
    userId: string, 
    limit: number = 20, 
    offset: number = 0
  ) {
    const result = await db.query(`
      SELECT 
        je.*,
        la.name as life_area_name,
        la.color as life_area_color
      FROM journal_entries je
      LEFT JOIN life_areas la ON je.life_area_id = la.id
      WHERE je.user_id = $1
      ORDER BY je.created_at DESC
      LIMIT $2 OFFSET $3
    `, [userId, limit, offset]);
    
    return result.rows;
  },

  /**
   * Get user's active habits
   */
  async getUserHabits(userId: string) {
    const result = await db.query(`
      SELECT 
        h.*,
        la.name as life_area_name,
        la.color as life_area_color
      FROM habits h
      LEFT JOIN life_areas la ON h.life_area_id = la.id
      WHERE h.user_id = $1 AND h.is_active = true
      ORDER BY h.created_at DESC
    `, [userId]);
    
    return result.rows;
  },

  /**
   * Get user's life areas
   */
  async getUserLifeAreas(userId: string) {
    const result = await db.query(
      'SELECT * FROM life_areas WHERE user_id = $1 ORDER BY name',
      [userId]
    );
    return result.rows;
  },

  /**
   * Track habit completion
   */
  async trackHabit(habitId: string, userId: string, value: number = 1, notes?: string) {
    const result = await db.query(`
      INSERT INTO habit_tracking (habit_id, user_id, value, notes)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (habit_id, tracked_date)
      DO UPDATE SET 
        value = $3,
        notes = COALESCE($4, habit_tracking.notes)
      RETURNING *
    `, [habitId, userId, value, notes]);
    
    return result.rows[0];
  },
};

// Initialize database on import (in production, this might be done separately)
if (process.env.NODE_ENV !== 'test') {
  db.testConnection().catch(console.error);
}

export default db;