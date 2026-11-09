import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class PostgresService {
  private pool: pg.Pool | null = null;
  private isConnected: boolean = false;

  constructor() {
    const databaseUrl = process.env.DATABASE_URL;
    if (databaseUrl) {
      this.pool = new Pool({
        connectionString: databaseUrl,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      });

      this.pool.on('error', (err) => {
        console.error('[Postgres] Unexpected error on idle client:', err);
      });
    }
  }

  public isAvailable(): boolean {
    return !!this.pool;
  }

  public async init(): Promise<boolean> {
    if (!this.pool) return false;

    try {
      const client = await this.pool.connect();
      try {
        await client.query('SELECT 1');
        this.isConnected = true;
        console.log('[Postgres] Connected to PostgreSQL database successfully.');

        // Run initial migrations
        await this.runMigrations(client);
        return true;
      } finally {
        client.release();
      }
    } catch (err: any) {
      console.warn('[Postgres] Could not connect to PostgreSQL database. Running in fallback memory mode.', err.message);
      this.isConnected = false;
      return false;
    }
  }

  private async runMigrations(client: pg.PoolClient): Promise<void> {
    try {
      const migrationFile = path.resolve(__dirname, 'migrations', '001_initial_schema.sql');
      if (fs.existsSync(migrationFile)) {
        const sql = fs.readFileSync(migrationFile, 'utf-8');
        await client.query(sql);
        console.log('[Postgres] Schema migrations executed successfully.');
      }
    } catch (err: any) {
      console.error('[Postgres] Migration execution error:', err.message);
    }
  }

  public async query(text: string, params?: any[]): Promise<pg.QueryResult> {
    if (!this.pool) {
      throw new Error('Database pool not initialized.');
    }
    return this.pool.query(text, params);
  }

  public async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      this.isConnected = false;
    }
  }
}

export const postgresService = new PostgresService();
