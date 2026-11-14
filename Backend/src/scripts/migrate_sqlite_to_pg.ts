import Database from 'better-sqlite3';
import pg from 'pg';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { initPostgresTables } from '../db.js';

dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '../.env.local') });

const { Pool } = pg;

const sqlitePath = process.env.DATABASE_PATH ? path.resolve(process.env.DATABASE_PATH) : path.resolve('database.sqlite');
const pgUrl = process.env.DATABASE_URL;

if (!pgUrl) {
  console.error('❌ Error: DATABASE_URL environment variable is required to migrate to Neon PostgreSQL.');
  process.exit(1);
}

if (!fs.existsSync(sqlitePath)) {
  console.error(`❌ Error: SQLite file not found at ${sqlitePath}`);
  process.exit(1);
}

console.log(`🚀 Starting Migration from SQLite (${sqlitePath}) to Neon PostgreSQL...`);

const sqlite = new Database(sqlitePath);
const pgPool = new Pool({
  connectionString: pgUrl,
  ssl: { rejectUnauthorized: false },
});

async function migrateTable(tableName: string, client: pg.PoolClient) {
  const rows = sqlite.prepare(`SELECT * FROM ${tableName}`).all() as any[];
  if (!rows || rows.length === 0) {
    console.log(`ℹ️  Table ${tableName}: 0 rows to migrate.`);
    return;
  }

  console.log(`⏳ Migrating ${rows.length} rows into "${tableName}"...`);

  for (const row of rows) {
    const keys = Object.keys(row);
    const values = Object.values(row);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    const columns = keys.map(k => `"${k}"`).join(', ');

    // Use ON CONFLICT DO NOTHING to avoid duplicate key errors
    let conflictClause = 'ON CONFLICT DO NOTHING';
    if (tableName === 'users' && keys.includes('email')) {
      conflictClause = 'ON CONFLICT (email) DO NOTHING';
    } else if (tableName === 'investor_projects' && keys.includes('user_id') && keys.includes('project_id')) {
      conflictClause = 'ON CONFLICT (user_id, project_id) DO NOTHING';
    } else if (keys.includes('id')) {
      conflictClause = 'ON CONFLICT (id) DO NOTHING';
    }

    const insertSql = `INSERT INTO "${tableName}" (${columns}) VALUES (${placeholders}) ${conflictClause}`;
    await client.query(insertSql, values);
  }

  // Update serial sequence so future auto-increment IDs start after the max ID
  if (tableName !== 'investor_projects') {
    try {
      await client.query(`SELECT setval(pg_get_serial_sequence('${tableName}', 'id'), COALESCE(MAX(id), 1)) FROM "${tableName}"`);
    } catch (e) {
      // Sequence might not exist or table doesn't use standard sequence
    }
  }

  console.log(`✅ Table "${tableName}" migrated successfully (${rows.length} rows).`);
}

async function run() {
  await initPostgresTables();
  const client = await pgPool.connect();
  try {
    const tablesInOrder = [
      'users',
      'projects',
      'investor_projects',
      'milestones',
      'progress_updates',
      'announcements',
      'queries',
      'payments',
      'notifications',
      'ledger',
      'password_resets',
    ];

    for (const table of tablesInOrder) {
      try {
        await migrateTable(table, client);
      } catch (err: any) {
        console.warn(`⚠️ Warning migrating ${table}:`, err.message);
      }
    }

    console.log('🎉 All SQLite data successfully migrated to Neon PostgreSQL!');
  } finally {
    client.release();
    await pgPool.end();
    sqlite.close();
  }
}

run().catch((err) => {
  console.error('Fatal migration error:', err);
  process.exit(1);
});

