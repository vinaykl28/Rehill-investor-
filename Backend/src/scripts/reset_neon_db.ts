import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import bcrypt from 'bcryptjs';

dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '../.env.local') });

const { Pool } = pg;

const pgUrl = process.env.DATABASE_URL;

if (!pgUrl) {
  console.error('❌ Error: DATABASE_URL is required to reset Neon database.');
  process.exit(1);
}

console.log('🧹 Connecting to Neon PostgreSQL to reset data to fresh state...');

const pool = new Pool({
  connectionString: pgUrl,
  ssl: { rejectUnauthorized: false },
});

async function reset() {
  const client = await pool.connect();
  try {
    console.log('⏳ Clearing all mock data (projects, milestones, ledger, queries, notifications)...');

    // 1. Truncate all project-related and auxiliary tables
    await client.query(`
      TRUNCATE TABLE 
        ledger,
        notifications,
        payments,
        queries,
        announcements,
        progress_updates,
        milestones,
        investor_projects,
        projects,
        password_resets
      RESTART IDENTITY CASCADE;
    `);

    console.log('✅ Cleared projects, milestones, ledger, queries, announcements, and notifications.');

    // 2. Remove all non-staff users
    const staffEmails = [
      'admin@redhillinfra.com',
      'admin@redhill.in',
      'sitemanager@redhillinfra.com',
      'finance@redhillinfra.com',
      'support@redhillinfra.com'
    ];

    await client.query(`
      DELETE FROM users 
      WHERE LOWER(TRIM(email)) NOT IN ($1, $2, $3, $4, $5);
    `, staffEmails);

    console.log('✅ Cleared all investor users.');

    // 3. Ensure the 5 staff members exist with verified roles
    const staffMembers = [
      { email: 'admin@redhillinfra.com', passwordPlain: 'admin123', name: 'Redhill Admin', role: 'super_admin' },
      { email: 'admin@redhill.in', passwordPlain: 'admin123', name: 'Super Admin', role: 'super_admin' },
      { email: 'sitemanager@redhillinfra.com', passwordPlain: 'site123', name: 'Site Engineer', role: 'site_manager' },
      { email: 'finance@redhillinfra.com', passwordPlain: 'finance123', name: 'Financial Officer', role: 'financial_officer' },
      { email: 'support@redhillinfra.com', passwordPlain: 'support123', name: 'Support Agent', role: 'support_agent' },
    ];

    for (const staff of staffMembers) {
      const res = await client.query('SELECT id FROM users WHERE LOWER(TRIM(email)) = $1', [staff.email.toLowerCase()]);
      if (res.rows.length === 0) {
        const hashed = bcrypt.hashSync(staff.passwordPlain, 10);
        await client.query(
          'INSERT INTO users (email, password, name, role) VALUES ($1, $2, $3, $4)',
          [staff.email.toLowerCase(), hashed, staff.name, staff.role]
        );
      } else {
        await client.query(
          'UPDATE users SET name = $1, role = $2 WHERE LOWER(TRIM(email)) = $3',
          [staff.name, staff.role, staff.email.toLowerCase()]
        );
      }
    }

    // 4. Print current state of users
    const finalUsers = await client.query('SELECT id, name, email, role, created_at FROM users ORDER BY id ASC');
    console.log('\n✨ Current Staff Accounts in Neon PostgreSQL:');
    console.table(finalUsers.rows);

    // 5. Verify counts of all other tables
    const counts = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM projects) as projects,
        (SELECT COUNT(*) FROM milestones) as milestones,
        (SELECT COUNT(*) FROM investor_projects) as allocations,
        (SELECT COUNT(*) FROM ledger) as ledger,
        (SELECT COUNT(*) FROM queries) as queries,
        (SELECT COUNT(*) FROM notifications) as notifications,
        (SELECT COUNT(*) FROM users) as total_users;
    `);
    console.log('\n📊 Database Summary (Fresh New App State):');
    console.table(counts.rows);

    console.log('\n🎉 Neon Database successfully reset! Ready as a clean, brand new app.');
  } finally {
    client.release();
    await pool.end();
  }
}

reset().catch(err => {
  console.error('Fatal error during reset:', err);
  process.exit(1);
});
