import pg from 'pg';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import config from './config/env.js';

const { Pool } = pg;

export const isPg = Boolean(config.DATABASE_URL);

let pgPool: pg.Pool | null = null;
let sqliteDb: any = null;

if (isPg) {
  pgPool = new Pool({
    connectionString: config.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

  // Handle unexpected idle connection errors to prevent unhandled node crash on serverless wake/sleep
  (pgPool as any).on('error', (err: any) => {
    console.error('Unexpected idle client error in PostgreSQL pool (handled gracefully):', err?.message || err);
  });

  console.log('📦 Connected to Neon PostgreSQL database.');
} else {
  const dbDir = path.dirname(config.DATABASE_PATH);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  sqliteDb = new Database(config.DATABASE_PATH);
  sqliteDb.pragma('journal_mode = WAL');
  sqliteDb.pragma('busy_timeout = 5000');
  console.log(`📁 Connected to local SQLite: ${config.DATABASE_PATH}`);
}

/**
 * Converts SQLite '?' placeholders to PostgreSQL '$1, $2, ...' placeholders.
 */
function toPgSql(sql: string): string {
  let paramIdx = 1;
  return sql.replace(/\?/g, () => `$${paramIdx++}`);
}

/**
 * Initializes tables in PostgreSQL
 */
export async function initPostgresTables() {
  if (!pgPool) return;
  const client = await pgPool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        phone VARCHAR(50),
        login_id VARCHAR(50) UNIQUE,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS projects (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        location VARCHAR(255) NOT NULL,
        total_value VARCHAR(100),
        status VARCHAR(100),
        image_url TEXT,
        completion_percentage INTEGER DEFAULT 0,
        cctv_url TEXT,
        description TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
      ALTER TABLE projects ADD COLUMN IF NOT EXISTS description TEXT;

      CREATE TABLE IF NOT EXISTS investor_projects (
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
        contribution TEXT,
        investment_amount NUMERIC DEFAULT 0,
        allotted_sqft NUMERIC DEFAULT 0,
        market_price_per_sqft NUMERIC DEFAULT 0,
        price_at_investment NUMERIC DEFAULT 0,
        investment_date TEXT,
        PRIMARY KEY(user_id, project_id)
      );

      CREATE TABLE IF NOT EXISTS milestones (
        id SERIAL PRIMARY KEY,
        project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
        category VARCHAR(50) NOT NULL,
        name VARCHAR(255) NOT NULL,
        status VARCHAR(50) NOT NULL,
        start_date TEXT,
        expected_completion TEXT,
        actual_completion TEXT,
        completion_percentage INTEGER DEFAULT 0,
        doc_url TEXT,
        target_days INTEGER DEFAULT 0,
        current_day INTEGER DEFAULT 0,
        notes TEXT,
        last_updated_at TIMESTAMPTZ
      );

      CREATE TABLE IF NOT EXISTS progress_updates (
        id SERIAL PRIMARY KEY,
        project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        url TEXT NOT NULL,
        caption TEXT,
        date TEXT NOT NULL,
        day_number INTEGER,
        milestone_id INTEGER REFERENCES milestones(id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS announcements (
        id SERIAL PRIMARY KEY,
        project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS queries (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        message TEXT NOT NULL,
        sender_role VARCHAR(50) NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS payments (
        id SERIAL PRIMARY KEY,
        project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        amount NUMERIC NOT NULL,
        date TEXT NOT NULL,
        type VARCHAR(50) NOT NULL,
        status VARCHAR(50) NOT NULL,
        description TEXT,
        file_url TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
        milestone_id INTEGER REFERENCES milestones(id) ON DELETE SET NULL,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        recipient_email VARCHAR(255) NOT NULL,
        recipient_name VARCHAR(255) NOT NULL,
        subject VARCHAR(255) NOT NULL,
        type VARCHAR(100) NOT NULL,
        content_html TEXT NOT NULL,
        message TEXT,
        is_read INTEGER DEFAULT 0,
        read_at TIMESTAMPTZ,
        status VARCHAR(50) DEFAULT 'unread',
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
      ALTER TABLE notifications ADD COLUMN IF NOT EXISTS message TEXT;
      ALTER TABLE notifications ADD COLUMN IF NOT EXISTS is_read INTEGER DEFAULT 0;
      ALTER TABLE notifications ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;

      CREATE TABLE IF NOT EXISTS ledger (
        id SERIAL PRIMARY KEY,
        project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        transaction_type VARCHAR(100) NOT NULL,
        investment_amount NUMERIC NOT NULL,
        contribution TEXT,
        allotted_sqft NUMERIC NOT NULL,
        price_at_investment NUMERIC NOT NULL,
        market_price_per_sqft NUMERIC,
        note TEXT,
        transaction_date TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS password_resets (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        otp VARCHAR(50) NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        used INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ PostgreSQL schemas verified / initialized.');
  } finally {
    client.release();
  }
}

/**
 * Initializes SQLite tables (when DATABASE_URL is not set)
 */
function initSqliteTables() {
  if (!sqliteDb) return;
  sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      phone TEXT,
      login_id TEXT UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      location TEXT NOT NULL,
      total_value TEXT,
      status TEXT,
      image_url TEXT,
      completion_percentage INTEGER DEFAULT 0,
      cctv_url TEXT,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS investor_projects (
      user_id INTEGER,
      project_id INTEGER,
      contribution TEXT,
      investment_amount REAL DEFAULT 0,
      allotted_sqft REAL DEFAULT 0,
      market_price_per_sqft REAL DEFAULT 0,
      price_at_investment REAL DEFAULT 0,
      investment_date TEXT,
      PRIMARY KEY(user_id, project_id)
    );

    CREATE TABLE IF NOT EXISTS milestones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER,
      category TEXT NOT NULL,
      name TEXT NOT NULL,
      status TEXT NOT NULL,
      start_date TEXT,
      expected_completion TEXT,
      actual_completion TEXT,
      completion_percentage INTEGER DEFAULT 0,
      doc_url TEXT,
      target_days INTEGER DEFAULT 0,
      current_day INTEGER DEFAULT 0,
      notes TEXT,
      last_updated_at DATETIME
    );

    CREATE TABLE IF NOT EXISTS progress_updates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER,
      type TEXT NOT NULL,
      url TEXT NOT NULL,
      caption TEXT,
      date TEXT NOT NULL,
      day_number INTEGER,
      milestone_id INTEGER
    );

    CREATE TABLE IF NOT EXISTS announcements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      date DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS queries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      project_id INTEGER NOT NULL,
      message TEXT NOT NULL,
      sender_role TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      date TEXT NOT NULL,
      type TEXT NOT NULL,
      status TEXT NOT NULL,
      description TEXT,
      file_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER,
      milestone_id INTEGER,
      user_id INTEGER,
      recipient_email TEXT NOT NULL,
      recipient_name TEXT NOT NULL,
      subject TEXT NOT NULL,
      type TEXT NOT NULL,
      content_html TEXT NOT NULL,
      message TEXT,
      is_read INTEGER DEFAULT 0,
      read_at DATETIME,
      status TEXT DEFAULT 'unread',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS ledger (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      transaction_type TEXT NOT NULL,
      investment_amount REAL NOT NULL,
      contribution TEXT,
      allotted_sqft REAL NOT NULL,
      price_at_investment REAL NOT NULL,
      market_price_per_sqft REAL,
      note TEXT,
      transaction_date TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS password_resets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      otp TEXT NOT NULL,
      expires_at DATETIME NOT NULL,
      used INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  try { sqliteDb.exec('ALTER TABLE projects ADD COLUMN description TEXT'); } catch {}
  try { sqliteDb.exec('ALTER TABLE notifications ADD COLUMN message TEXT'); } catch {}
  try { sqliteDb.exec('ALTER TABLE notifications ADD COLUMN is_read INTEGER DEFAULT 0'); } catch {}
  try { sqliteDb.exec('ALTER TABLE notifications ADD COLUMN read_at DATETIME'); } catch {}
}

if (!isPg) {
  initSqliteTables();
}

/**
 * Universal Database Interface
 */
export const db = {
  isPg,

  async query(text: string, params: any[] = []): Promise<any> {
    if (isPg && pgPool) {
      const pgSql = toPgSql(text);
      return await pgPool.query(pgSql, params);
    } else {
      const stmt = sqliteDb.prepare(text);
      if (text.trim().toUpperCase().startsWith('SELECT')) {
        return { rows: stmt.all(...params) };
      } else {
        const result = stmt.run(...params);
        return { rowCount: result.changes, rows: [{ id: result.lastInsertRowid }] };
      }
    }
  },

  async get<T = any>(text: string, ...params: any[]): Promise<T | null> {
    const flatParams = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
    if (isPg && pgPool) {
      const pgSql = toPgSql(text);
      const res = await pgPool.query(pgSql, flatParams);
      return (res.rows[0] as T) || null;
    } else {
      return (sqliteDb.prepare(text).get(...flatParams) as T) || null;
    }
  },

  async all<T = any>(text: string, ...params: any[]): Promise<T[]> {
    const flatParams = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
    if (isPg && pgPool) {
      const pgSql = toPgSql(text);
      const res = await pgPool.query(pgSql, flatParams);
      return (res.rows as T[]) || [];
    } else {
      return (sqliteDb.prepare(text).all(...flatParams) as T[]) || [];
    }
  },

  async run(text: string, ...params: any[]): Promise<{ lastInsertRowid?: number | string; changes?: number }> {
    const flatParams = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
    if (isPg && pgPool) {
      let pgSql = toPgSql(text);
      const isInsert = text.trim().toUpperCase().startsWith('INSERT');
      const hasReturning = pgSql.toUpperCase().includes('RETURNING');
      const isTableWithoutId = /insert\s+into\s+investor_projects/i.test(text);

      if (isInsert && !hasReturning) {
        if (isTableWithoutId) {
          const res = await pgPool.query(pgSql, flatParams);
          return { changes: res.rowCount ?? 0 };
        }
        try {
          const res = await pgPool.query(pgSql + ' RETURNING id', flatParams);
          const id = res.rows[0]?.id;
          return { lastInsertRowid: id, changes: res.rowCount ?? 0 };
        } catch (err: any) {
          if (err.message && err.message.includes('column "id" does not exist')) {
            const res = await pgPool.query(pgSql, flatParams);
            return { changes: res.rowCount ?? 0 };
          }
          throw err;
        }
      }

      const res = await pgPool.query(pgSql, flatParams);
      const id = res.rows[0]?.id;
      return { lastInsertRowid: id, changes: res.rowCount ?? 0 };
    } else {
      const res = sqliteDb.prepare(text).run(...flatParams);
      return { lastInsertRowid: res.lastInsertRowid, changes: res.changes };
    }
  },

  /**
   * Compatibility wrapper for db.prepare(sql).get / .all / .run
   */
  prepare(sql: string) {
    if (!isPg && sqliteDb) {
      return sqliteDb.prepare(sql);
    }
    return {
      get: (...params: any[]) => this.get(sql, ...params),
      all: (...params: any[]) => this.all(sql, ...params),
      run: (...params: any[]) => this.run(sql, ...params),
    };
  },

  exec(sql: string) {
    if (!isPg && sqliteDb) {
      return sqliteDb.exec(sql);
    }
    if (isPg && pgPool) {
      return pgPool.query(sql);
    }
  }
};

export default db;
