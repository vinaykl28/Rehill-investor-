import { Response } from 'express';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import db from '../db.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import { sendEmail, sendEmailDetailed } from '../services/email.service.js';
import {
  sendMilestoneCompletedNotification,
  recalculateProjectProgress,
  getNotificationLogs,
  getProjectInvestors,
} from '../services/notification.service.js';

const VALID_STAFF_ROLES = ['super_admin', 'senior_admin', 'admin', 'site_manager', 'financial_officer', 'marketing_manager', 'support_agent'];

// Manage Admins
export const getAdmins = async (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'super_admin' && req.user?.role !== 'senior_admin') return res.status(403).json({ error: 'Admin management access required' });
  const admins = await db.all("SELECT id, email, name, role FROM users WHERE role != 'investor' ORDER BY id ASC");
  res.json(admins);
};

export const createAdmin = async (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'super_admin' && req.user?.role !== 'senior_admin') return res.status(403).json({ error: 'Admin management access required' });
  const { email, password, name, role } = req.body;
  if (!VALID_STAFF_ROLES.includes(role)) return res.status(400).json({ error: 'Invalid role' });
  const hashedPassword = bcrypt.hashSync(password, 10);
  try {
    const result = await db.run('INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)', email, hashedPassword, name, role);
    res.json({ id: result.lastInsertRowid, email, name, role });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
};

export const updateAdmin = async (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'super_admin' && req.user?.role !== 'senior_admin') return res.status(403).json({ error: 'Admin management access required' });
  const { id } = req.params;
  const { name, email, role, password } = req.body;

  if (role && !VALID_STAFF_ROLES.includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  try {
    if (password) {
      const hashedPassword = bcrypt.hashSync(password, 10);
      await db.run(`
        UPDATE users
        SET name = COALESCE(?, name),
            email = COALESCE(?, email),
            role = COALESCE(?, role),
            password = ?
        WHERE id = ? AND role != 'investor'
      `, name || null, email || null, role || null, hashedPassword, id);
    } else {
      await db.run(`
        UPDATE users
        SET name = COALESCE(?, name),
            email = COALESCE(?, email),
            role = COALESCE(?, role)
        WHERE id = ? AND role != 'investor'
      `, name || null, email || null, role || null, id);
    }
    res.json({ message: 'Admin updated successfully' });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
};

export const deleteAdmin = async (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'super_admin') return res.status(403).json({ error: 'Super Admin required to delete staff' });
  const { id } = req.params;
  if (Number(id) === req.user?.id) {
    return res.status(400).json({ error: 'Cannot delete your own account' });
  }
  try {
    await db.run("DELETE FROM users WHERE id = ? AND role != 'investor'", id);
    res.json({ message: 'Admin deleted successfully' });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
};

// Manage Investors
export const getInvestors = async (_req: AuthRequest, res: Response) => {
  const investors = await db.all('SELECT id, email, name, phone, login_id FROM users WHERE role = ?', 'investor');
  res.json(investors);
};

export const createInvestor = async (req: AuthRequest, res: Response) => {
  const cleanEmail = (req.body?.email || '').trim().toLowerCase();
  const cleanName = (req.body?.name || '').trim();
  const cleanPhone = (req.body?.phone || '').trim();
  const rawPassword = typeof req.body?.password === 'string' ? req.body.password : '';
  if (!cleanEmail || !cleanName || !rawPassword) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }
  const hashedPassword = bcrypt.hashSync(rawPassword, 10);
  const login_id = (
    cleanName.substring(0, 2).toLowerCase() +
    (cleanPhone.replace(/\D/g, '').slice(-3) || Math.floor(100 + Math.random() * 900)) +
    Math.floor(10 + Math.random() * 90)
  );

  try {
    const result = await db.run(
      'INSERT INTO users (email, password, name, role, phone, login_id) VALUES (?, ?, ?, ?, ?, ?)',
      cleanEmail, hashedPassword, cleanName, 'investor', cleanPhone, login_id
    );
    res.json({ id: result.lastInsertRowid, email: cleanEmail, name: cleanName, role: 'investor', login_id, phone: cleanPhone });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
};

export const deleteInvestor = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    await db.run('DELETE FROM notifications WHERE user_id = ?', id);
    await db.run('DELETE FROM payments WHERE user_id = ?', id);
    await db.run('DELETE FROM investor_projects WHERE user_id = ?', id);
    await db.run('DELETE FROM queries WHERE user_id = ?', id);
    await db.run('DELETE FROM users WHERE id = ? AND role = ?', id, 'investor');
    res.json({ message: 'Investor deleted successfully' });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
};

// Manage Projects
export const getProjects = async (_req: AuthRequest, res: Response) => {
  const projects = await db.all('SELECT * FROM projects');
  res.json(projects);
};

export const createProject = async (req: AuthRequest, res: Response) => {
  const { name, location, total_value = '', status, image_url, cctv_url = '', description = '' } = req.body;
  const result = await db.run(
    'INSERT INTO projects (name, location, total_value, status, image_url, cctv_url, description) VALUES (?, ?, ?, ?, ?, ?, ?)',
    name, location, total_value, status, image_url, cctv_url, description
  );
  res.json({ id: result.lastInsertRowid, name, location });
};

export const updateProject = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { name, location, total_value, status, image_url, completion_percentage, cctv_url, description } = req.body;
  try {
    await db.run(`
      UPDATE projects 
      SET name = COALESCE(?, name),
          location = COALESCE(?, location),
          total_value = COALESCE(?, total_value),
          status = COALESCE(?, status),
          image_url = COALESCE(?, image_url),
          completion_percentage = COALESCE(?, completion_percentage),
          cctv_url = COALESCE(?, cctv_url),
          description = COALESCE(?, description)
      WHERE id = ?
    `, name, location, total_value, status, image_url, completion_percentage, cctv_url, description, id);
    res.json({ message: 'Project updated successfully' });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
};

export const deleteProject = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    await db.run('DELETE FROM notifications WHERE project_id = ?', id);
    await db.run('DELETE FROM progress_updates WHERE project_id = ?', id);
    await db.run('DELETE FROM announcements WHERE project_id = ?', id);
    await db.run('DELETE FROM milestones WHERE project_id = ?', id);
    await db.run('DELETE FROM payments WHERE project_id = ?', id);
    await db.run('DELETE FROM investor_projects WHERE project_id = ?', id);
    await db.run('DELETE FROM queries WHERE project_id = ?', id);
    await db.run('DELETE FROM projects WHERE id = ?', id);
    res.json({ message: 'Project deleted successfully' });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
};

export const updateCctv = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { cctv_url } = req.body;
  await db.run('UPDATE projects SET cctv_url = ? WHERE id = ?', cctv_url, id);
  res.json({ success: true });
};

// Assign Investor to Project
export const assignInvestor = async (req: AuthRequest, res: Response) => {
  const { user_id, project_id, contribution, investment_amount, allotted_sqft, market_price_per_sqft, price_at_investment, investment_date } = req.body;
  try {
    const existing: any = await db.get(
      'SELECT * FROM investor_projects WHERE user_id = ? AND project_id = ?',
      user_id, project_id
    );

    if (existing) {
      await db.run(
        'UPDATE investor_projects SET contribution = ?, investment_amount = ?, allotted_sqft = ?, market_price_per_sqft = ?, price_at_investment = ?, investment_date = ? WHERE user_id = ? AND project_id = ?',
        contribution, investment_amount || 0, allotted_sqft || 0, market_price_per_sqft || 0, price_at_investment || 0, investment_date || null, user_id, project_id
      );
    } else {
      await db.run(
        'INSERT INTO investor_projects (user_id, project_id, contribution, investment_amount, allotted_sqft, market_price_per_sqft, price_at_investment, investment_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        user_id, project_id, contribution, investment_amount || 0, allotted_sqft || 0, market_price_per_sqft || 0, price_at_investment || 0, investment_date || null
      );
    }

    await db.run(`
      INSERT INTO ledger (
        user_id, project_id, transaction_type, investment_amount, contribution, allotted_sqft, price_at_investment, market_price_per_sqft, note, transaction_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      user_id, project_id, 'initial_assignment', investment_amount || 0, contribution, allotted_sqft || 0, price_at_investment || market_price_per_sqft || 0, market_price_per_sqft || 0, 'Initial Investor Assignment', investment_date || new Date().toISOString().split('T')[0]
    );

    res.json({ message: 'Assigned successfully' });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
};

export const updateAssignment = async (req: AuthRequest, res: Response) => {
  const { userId, projectId } = req.params;
  const { investment_amount, allotted_sqft, market_price_per_sqft, contribution, price_at_investment, investment_date } = req.body;
  try {
    await db.run(
      'UPDATE investor_projects SET investment_amount = ?, allotted_sqft = ?, market_price_per_sqft = ?, contribution = ?, price_at_investment = ?, investment_date = ? WHERE user_id = ? AND project_id = ?',
      investment_amount, allotted_sqft, market_price_per_sqft, contribution, price_at_investment || 0, investment_date || null, userId, projectId
    );
    res.json({ message: 'Updated successfully' });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
};

export const getAssignments = async (_req: AuthRequest, res: Response) => {
  const assignments = await db.all(`
    SELECT ip.*, u.name as investor_name, u.email as investor_email, p.name as project_name
    FROM investor_projects ip
    JOIN users u ON ip.user_id = u.id
    JOIN projects p ON ip.project_id = p.id
    ORDER BY u.name, p.name
  `);
  res.json(assignments);
};

// Ledger & Sub-investments
export const getLedger = async (_req: AuthRequest, res: Response) => {
  try {
    const entries = await db.all(`
      SELECT l.*, u.name as investor_name, u.login_id as investor_login_id, p.name as project_name
      FROM ledger l
      JOIN users u ON l.user_id = u.id
      JOIN projects p ON l.project_id = p.id
      ORDER BY l.created_at DESC, l.id DESC
    `);
    res.json(entries);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
};

export const addSubInvestment = async (req: AuthRequest, res: Response) => {
  const { user_id, project_id, investment_amount, allotted_sqft, price_at_investment, market_price_per_sqft, note, transaction_date } = req.body;

  try {
    const existing: any = await db.get('SELECT * FROM investor_projects WHERE user_id = ? AND project_id = ?', user_id, project_id);
    if (!existing) {
      return res.status(404).json({ error: 'Investor not assigned to this project' });
    }

    const newAmount = (existing.investment_amount || 0) + Number(investment_amount || 0);
    const newSqft = (existing.allotted_sqft || 0) + Number(allotted_sqft || 0);
    const newPrice = Number(market_price_per_sqft || price_at_investment || existing.market_price_per_sqft || 0);

    await db.run(`
      UPDATE investor_projects
      SET investment_amount = ?,
          allotted_sqft = ?,
          market_price_per_sqft = ?
      WHERE user_id = ? AND project_id = ?
    `, newAmount, newSqft, newPrice, user_id, project_id);

    await db.run(`
      INSERT INTO ledger (
        user_id, project_id, transaction_type, investment_amount, contribution, allotted_sqft, price_at_investment, market_price_per_sqft, note, transaction_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      user_id, project_id, 'sub_investment', investment_amount, existing.contribution || '', allotted_sqft, price_at_investment || newPrice, newPrice, note || 'Sub-investment capital infusion', transaction_date || new Date().toISOString().split('T')[0]
    );

    res.json({ success: true, message: 'Sub-investment recorded successfully' });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
};

// Manage Milestones & Project Investor Audience
export const getMilestones = async (req: AuthRequest, res: Response) => {
  const milestones = await db.all('SELECT * FROM milestones WHERE project_id = ? ORDER BY id ASC', req.params.id);
  res.json(milestones);
};

export const getMilestonesWithInvestors = async (req: AuthRequest, res: Response) => {
  const projectId = parseInt(req.params.id, 10);
  const project = await db.get('SELECT * FROM projects WHERE id = ?', projectId);
  const milestones = await db.all('SELECT * FROM milestones WHERE project_id = ? ORDER BY id ASC', projectId);
  const investors = await getProjectInvestors(projectId);

  res.json({
    project,
    milestones,
    investors,
    totalInvestors: investors.length,
  });
};

export const createMilestone = async (req: AuthRequest, res: Response) => {
  const {
    project_id,
    category,
    name,
    status = 'pending',
    start_date,
    expected_completion,
    actual_completion,
    completion_percentage = 0,
    doc_url,
    target_days = 0,
    current_day = 0,
    notes = '',
  } = req.body;

  try {
    const isCompleted = status === 'completed' || completion_percentage >= 100;
    const finalStatus = isCompleted ? 'completed' : (completion_percentage > 0 ? 'in_progress' : status);
    const finalPct = isCompleted ? 100 : completion_percentage;
    const finalActual = isCompleted ? (actual_completion || new Date().toISOString().split('T')[0]) : actual_completion;

    const result = await db.run(`
      INSERT INTO milestones (
        project_id, category, name, status, start_date, expected_completion, actual_completion, 
        completion_percentage, doc_url, target_days, current_day, notes, last_updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `,
      project_id, category, name, finalStatus, start_date || null, expected_completion || null,
      finalActual || null, finalPct, doc_url || null, target_days || 0, current_day || 0, notes || null
    );

    const milestoneId = Number(result.lastInsertRowid);

    await recalculateProjectProgress(project_id);

    if (isCompleted) {
      sendMilestoneCompletedNotification(milestoneId, {
        customNotes: notes,
        dayNumber: current_day,
        completionDate: finalActual,
      }).catch((notifyErr) => {
        console.error('Error triggering milestone notification:', notifyErr);
      });
    }

    res.json({
      id: milestoneId,
      status: finalStatus,
      completion_percentage: finalPct,
    });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
};

export const updateMilestone = async (req: AuthRequest, res: Response) => {
  const milestoneId = parseInt(req.params.id, 10);
  const {
    name,
    category,
    status,
    actual_completion,
    completion_percentage,
    doc_url,
    target_days,
    current_day,
    notes,
    sendNotification,
  } = req.body;

  try {
    const prevMilestone: any = await db.get('SELECT * FROM milestones WHERE id = ?', milestoneId);
    if (!prevMilestone) return res.status(404).json({ error: 'Milestone not found' });

    const wasAlreadyCompleted = prevMilestone.status === 'completed' || Number(prevMilestone.completion_percentage) >= 100;
    const isNowCompleted = status === 'completed' || (completion_percentage !== undefined && Number(completion_percentage) >= 100);

    const newStatus = isNowCompleted ? 'completed' : (status || prevMilestone.status);
    const newPct = isNowCompleted ? 100 : (completion_percentage !== undefined ? completion_percentage : prevMilestone.completion_percentage);
    const newActual = isNowCompleted ? (actual_completion || prevMilestone.actual_completion || new Date().toISOString().split('T')[0]) : (actual_completion || prevMilestone.actual_completion);

    await db.run(`
      UPDATE milestones 
      SET name = COALESCE(?, name),
          category = COALESCE(?, category),
          status = ?,
          actual_completion = ?,
          completion_percentage = ?,
          doc_url = COALESCE(?, doc_url),
          target_days = COALESCE(?, target_days),
          current_day = COALESCE(?, current_day),
          notes = COALESCE(?, notes),
          last_updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
      name || null,
      category || null,
      newStatus,
      newActual || null,
      newPct,
      doc_url !== undefined ? doc_url : null,
      target_days !== undefined ? target_days : null,
      current_day !== undefined ? current_day : null,
      notes !== undefined ? notes : null,
      milestoneId
    );

    // Recalculate project progress immediately in database
    await recalculateProjectProgress(prevMilestone.project_id);

    // Send notifications in background whenever milestone is completed or explicitly requested
    if (newStatus === 'completed' || isNowCompleted || sendNotification) {
      sendMilestoneCompletedNotification(milestoneId, {
        customNotes: notes || prevMilestone.notes,
        dayNumber: current_day || prevMilestone.current_day,
        completionDate: newActual,
      }).catch((err) => {
        console.error('Error dispatching automated milestone notification:', err);
      });
    }

    res.json({
      success: true,
      message: 'Milestone updated successfully',
    });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
};

export const deleteMilestone = async (req: AuthRequest, res: Response) => {
  const milestoneId = parseInt(req.params.id, 10);
  try {
    const milestone: any = await db.get('SELECT project_id FROM milestones WHERE id = ?', milestoneId);
    if (!milestone) return res.status(404).json({ error: 'Milestone not found' });

    await db.run('DELETE FROM notifications WHERE milestone_id = ?', milestoneId);
    await db.run('DELETE FROM progress_updates WHERE milestone_id = ?', milestoneId);
    await db.run('DELETE FROM milestones WHERE id = ?', milestoneId);

    await recalculateProjectProgress(milestone.project_id);
    res.json({ message: 'Milestone deleted successfully' });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
};

// Log Daily Construction Progress
export const logDailyProgress = async (req: AuthRequest, res: Response) => {
  const {
    milestone_id,
    project_id,
    day_number,
    work_notes,
    completion_percentage,
    is_completed,
    media_type,
    media_url,
    date = new Date().toISOString().split('T')[0],
  } = req.body;

  try {
    if (!project_id) return res.status(400).json({ error: 'project_id is required' });

    let milestone: any = null;
    if (milestone_id) {
      milestone = await db.get('SELECT * FROM milestones WHERE id = ?', milestone_id);
    }

    if (media_url || work_notes) {
      await db.run(`
        INSERT INTO progress_updates (project_id, type, url, caption, date, milestone_id, day_number)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
        project_id,
        media_type || 'photo',
        media_url || 'https://images.unsplash.com/photo-1541888946425-d81bb19480c5?auto=format&fit=crop&q=80&w=2070',
        `Day ${day_number || ''}: ${work_notes || 'Daily site progress update'}`,
        date,
        milestone_id || null,
        day_number || null
      );
    }

    let notificationResult = null;

    if (milestone) {
      const willComplete = is_completed || completion_percentage >= 100;
      const targetPct = willComplete ? 100 : (completion_percentage !== undefined ? completion_percentage : milestone.completion_percentage);
      const targetStatus = willComplete ? 'completed' : (targetPct > 0 ? 'in_progress' : milestone.status);
      const actualCompletion = willComplete ? date : milestone.actual_completion;

      await db.run(`
        UPDATE milestones
        SET current_day = COALESCE(?, current_day),
            completion_percentage = ?,
            status = ?,
            actual_completion = ?,
            notes = COALESCE(?, notes),
            last_updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
        day_number || null,
        targetPct,
        targetStatus,
        actualCompletion || null,
        work_notes || null,
        milestone.id
      );

      await recalculateProjectProgress(project_id);

      if (willComplete && milestone.status !== 'completed') {
        sendMilestoneCompletedNotification(milestone.id, {
          customNotes: work_notes,
          dayNumber: day_number,
          completionDate: date,
        }).catch((err) => {
          console.error('Error dispatching automated milestone completion email:', err);
        });
      }
    } else {
      await recalculateProjectProgress(project_id);
    }

    res.json({
      success: true,
      message: 'Daily construction progress logged successfully',
    });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
};

export const manualNotifyMilestone = async (req: AuthRequest, res: Response) => {
  const milestoneId = parseInt(req.params.id, 10);
  const { customNotes, dayNumber } = req.body;

  try {
    const result = await sendMilestoneCompletedNotification(milestoneId, {
      customNotes,
      dayNumber,
    });
    if (!result.success) {
      return res.status(500).json({ error: result.message, details: result });
    }
    res.json(result);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
};

export const testSmtpConnection = async (req: AuthRequest, res: Response) => {
  try {
    const targetEmail = req.body?.to || req.user?.email || 'vinaykspammail@gmail.com';
    const result = await sendEmailDetailed({
      to: targetEmail,
      subject: '🧪 Redhill Infra SMTP Connection Test',
      html: `<h2>Redhill Infra Verification</h2><p>Your Gmail SMTP setup is working and successfully connected from Render to ${targetEmail}!</p>`
    });

    if (result.success) {
      res.json({ success: true, message: `Test email successfully sent to ${targetEmail}`, messageId: result.messageId });
    } else {
      res.status(500).json({ error: result.error || 'SMTP delivery failed' });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const projectId = req.query.projectId ? parseInt(req.query.projectId as string, 10) : undefined;
    const milestoneId = req.query.milestoneId ? parseInt(req.query.milestoneId as string, 10) : undefined;
    const userId = req.query.userId ? parseInt(req.query.userId as string, 10) : undefined;

    const logs = await getNotificationLogs({ projectId, milestoneId, userId });
    res.json(logs);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
};

export const createUpdate = async (req: AuthRequest, res: Response) => {
  const { project_id, type, url, caption, date, milestone_id } = req.body;
  const result = await db.run(
    'INSERT INTO progress_updates (project_id, type, url, caption, date, milestone_id) VALUES (?, ?, ?, ?, ?, ?)',
    project_id, type, url, caption, date, milestone_id
  );

  const project: any = await db.get('SELECT name FROM projects WHERE id = ?', project_id);
  const investors: any[] = await db.all('SELECT u.email, u.name FROM users u JOIN investor_projects ip ON ip.user_id = u.id WHERE ip.project_id = ?', project_id);
  
  if (project && investors.length > 0) {
    const emails = investors.map(i => i.email);
    sendEmail({
      to: emails,
      subject: `New Media Update: ${project.name}`,
      html: `<h2>Redhill Infra Updates</h2><p>A new ${type} update has been added to ${project.name}.</p><p><strong>Caption:</strong> ${caption}</p><p>Log in to your portal to view it.</p>`
    }).catch(console.error);
  }

  res.json({ id: result.lastInsertRowid });
};

export const uploadFile = (req: AuthRequest, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  // Persist uploaded images (<= 4MB) as self-contained data URIs so they never disappear on ephemeral Render restarts
  if (req.file.mimetype?.startsWith('image/') && req.file.size <= 4 * 1024 * 1024 && req.file.path) {
    try {
      const base64 = fs.readFileSync(req.file.path).toString('base64');
      try { fs.unlinkSync(req.file.path); } catch {}
      return res.json({
        url: `data:${req.file.mimetype};base64,${base64}`,
        filename: req.file.originalname,
        mimetype: req.file.mimetype,
      });
    } catch {
      // Fallback to local /uploads URL if file read fails
    }
  }
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({ url: fileUrl, filename: req.file.originalname, mimetype: req.file.mimetype });
};

export const getAnalytics = async (_req: AuthRequest, res: Response) => {
  try {
    const totalFunds: any = await db.get('SELECT SUM(investment_amount) as total FROM investor_projects');
    const totalSqft: any = await db.get('SELECT SUM(allotted_sqft) as total FROM investor_projects');
    const activeProjects: any = await db.get("SELECT COUNT(*) as count FROM projects WHERE status IN ('active', 'in_progress', 'Construction')");
    const totalNotifications: any = await db.get('SELECT COUNT(*) as count FROM notifications');

    res.json({
      totalFundsRaised: totalFunds?.total || 0,
      totalAllottedSqft: totalSqft?.total || 0,
      activeProjectsCount: activeProjects?.count || 0,
      totalNotificationsCount: totalNotifications?.count || 0,
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
};

export const getPayments = async (req: AuthRequest, res: Response) => {
  const { projectId, userId } = req.params;
  const payments = await db.all('SELECT * FROM payments WHERE project_id = ? AND user_id = ? ORDER BY date DESC', projectId, userId);
  res.json(payments);
};

export const addPayment = async (req: AuthRequest, res: Response) => {
  const { project_id, user_id, amount, date, type, status, description, file_url } = req.body;
  const result = await db.run(
    'INSERT INTO payments (project_id, user_id, amount, date, type, status, description, file_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    project_id, user_id, amount, date, type, status, description, file_url
  );
  res.json({ id: result.lastInsertRowid });
};
