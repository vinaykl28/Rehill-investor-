import db from '../db.js';
import bcrypt from 'bcryptjs';

export const seedData = async () => {
  // Helper to upsert staff/admin user
  const ensureUser = async (email: string, passwordPlain: string, name: string, role: string, phone: string = '', login_id: string = '') => {
    const cleanEmail = email.trim().toLowerCase();
    let u: any = await db.get('SELECT * FROM users WHERE LOWER(TRIM(email)) = ?', cleanEmail);
    if (!u) {
      const hashedPassword = bcrypt.hashSync(passwordPlain, 10);
      const res = await db.run(
        'INSERT INTO users (email, password, name, role, phone, login_id) VALUES (?, ?, ?, ?, ?, ?)',
        cleanEmail, hashedPassword, name, role, phone, login_id || null
      );
      u = { id: res.lastInsertRowid, email: cleanEmail, name, role, phone, login_id };
    }
    return u;
  };

  // Seed only Staff / Admin Accounts so projects and investors start clean for fresh uploads
  await ensureUser('admin@redhillinfra.com', 'admin123', 'Super Admin', 'super_admin');
  await ensureUser('admin@redhill.in', 'admin123', 'Super Admin', 'super_admin');
  await ensureUser('sitemanager@redhillinfra.com', 'site123', 'Site Engineer', 'site_manager');
  await ensureUser('finance@redhillinfra.com', 'finance123', 'Financial Officer', 'financial_officer');
  await ensureUser('support@redhillinfra.com', 'support123', 'Support Agent', 'support_agent');

  console.log('Admin accounts verified. Projects and investor records kept clean for fresh uploads.');
};
