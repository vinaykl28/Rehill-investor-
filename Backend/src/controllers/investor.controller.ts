import { Response } from 'express';
import db from '../db.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import { getNotificationLogs } from '../services/notification.service.js';

export const getProjects = async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  const projects = await db.all(`
    SELECT p.*, ip.contribution, ip.investment_amount, ip.allotted_sqft, ip.market_price_per_sqft, ip.price_at_investment, ip.investment_date 
    FROM projects p 
    JOIN investor_projects ip ON p.id = ip.project_id 
    WHERE ip.user_id = ?
  `, req.user.id);
  res.json(projects);
};

export const getProjectById = async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const isStaff = ['admin', 'super_admin', 'senior_admin', 'site_manager', 'financial_officer', 'marketing_manager', 'support_agent'].includes(req.user.role);
    const access: any = await db.get('SELECT * FROM investor_projects WHERE user_id = ? AND project_id = ?', req.user.id, req.params.id);

    if (!access && !isStaff) return res.status(403).json({ error: 'Access denied' });

    const project: any = await db.get('SELECT * FROM projects WHERE id = ?', req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    if (access && project) {
      project.contribution = access.contribution;
      project.investment_amount = access.investment_amount;
      project.allotted_sqft = access.allotted_sqft;
      project.market_price_per_sqft = access.market_price_per_sqft;
      project.price_at_investment = access.price_at_investment;
      project.investment_date = access.investment_date;
    }

    const milestones = await db.all('SELECT * FROM milestones WHERE project_id = ? ORDER BY id ASC', req.params.id);
    const updates = await db.all('SELECT * FROM progress_updates WHERE project_id = ? ORDER BY date DESC, id DESC', req.params.id);
    const announcements = await db.all('SELECT * FROM announcements WHERE project_id = ? ORDER BY date DESC, id DESC', req.params.id);
    const queries = isStaff
      ? await db.all('SELECT * FROM queries WHERE project_id = ? ORDER BY created_at ASC', req.params.id)
      : await db.all('SELECT * FROM queries WHERE user_id = ? AND project_id = ? ORDER BY created_at ASC', req.user.id, req.params.id);

    res.json({ project, milestones, updates, announcements, queries });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
};

export const getNewProjects = async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const newProjects = await db.all(`
      SELECT p.* FROM projects p 
      WHERE p.id NOT IN (
        SELECT ip.project_id FROM investor_projects ip WHERE ip.user_id = ?
      )
      ORDER BY p.created_at DESC
    `, req.user.id);
    res.json(newProjects);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
};

export const getPayments = async (req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.params;
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const isStaff = ['admin', 'super_admin', 'senior_admin', 'site_manager', 'financial_officer', 'marketing_manager', 'support_agent'].includes(req.user.role);
    const payments = isStaff
      ? await db.all('SELECT * FROM payments WHERE project_id = ? ORDER BY date DESC', projectId)
      : await db.all('SELECT * FROM payments WHERE project_id = ? AND user_id = ? ORDER BY date DESC', projectId, userId);
    res.json(payments);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
};

export const getInvestorLedger = async (req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.params;
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const isStaff = ['admin', 'super_admin', 'senior_admin', 'site_manager', 'financial_officer', 'marketing_manager', 'support_agent'].includes(req.user.role);
    const entries = isStaff
      ? await db.all('SELECT * FROM ledger WHERE project_id = ? ORDER BY transaction_date DESC', projectId)
      : await db.all('SELECT * FROM ledger WHERE project_id = ? AND user_id = ? ORDER BY transaction_date DESC', projectId, userId);
    res.json(entries);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
};

export const getNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const notifications = await getNotificationLogs({ userId });
    res.json(notifications);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
};
