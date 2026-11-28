import { Response } from 'express';
import db from '../db.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import { createPortalNotifications } from '../services/notification.service.js';

export const sendQuery = async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  const { project_id, message, user_id } = req.body;
  const isStaff = req.user.role !== 'investor';
  const targetUserId = isStaff ? (user_id || req.user.id) : req.user.id;

  if (!project_id || !message || !targetUserId) {
    return res.status(400).json({ error: 'Missing required fields: project_id, message, user_id' });
  }

  try {
    const result = await db.run(
      'INSERT INTO queries (user_id, project_id, message, sender_role) VALUES (?, ?, ?, ?)',
      targetUserId, project_id, message.trim(), req.user.role
    );

    if (isStaff && Number(targetUserId) !== Number(req.user.id)) {
      await createPortalNotifications({
        projectId: Number(project_id),
        targetUserId: Number(targetUserId),
        type: 'query',
        title: 'New Concierge Response',
        message: message.trim().slice(0, 160),
      });
    }

    res.json({ id: result.lastInsertRowid, created_at: new Date().toISOString() });
  } catch (err: any) {
    console.error('Error inserting query:', err);
    res.status(500).json({ error: err.message || 'Failed to send query' });
  }
};

export const getInvestorQueries = async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  const queries = await db.all(
    'SELECT * FROM queries WHERE user_id = ? AND project_id = ? ORDER BY created_at ASC',
    req.user.id, req.params.projectId
  );
  res.json(queries);
};

export const getAdminQueryThreads = async (_req: AuthRequest, res: Response) => {
  const threads = await db.all(`
    SELECT q.user_id, q.project_id, u.name as "userName", p.name as "projectName", MAX(q.created_at) as "lastMessage",
      (SELECT q2.sender_role FROM queries q2 WHERE q2.user_id = q.user_id AND q2.project_id = q.project_id ORDER BY q2.created_at DESC LIMIT 1) as last_sender_role
    FROM queries q
    JOIN users u ON q.user_id = u.id
    JOIN projects p ON q.project_id = p.id
    GROUP BY q.user_id, q.project_id, u.name, p.name
    ORDER BY "lastMessage" DESC
  `);
  res.json(threads);
};

export const getAdminQueryThread = async (req: AuthRequest, res: Response) => {
  const queries = await db.all(
    'SELECT * FROM queries WHERE user_id = ? AND project_id = ? ORDER BY created_at ASC',
    req.params.userId, req.params.projectId
  );
  res.json(queries);
};

function canManageQuery(user: NonNullable<AuthRequest['user']>, existing: any): boolean {
  const isStaff = user.role !== 'investor';
  if (isStaff) {
    return existing.sender_role !== 'investor';
  }
  return Number(existing.user_id) === Number(user.id) && existing.sender_role === 'investor';
}

export const updateQuery = async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  const trimmed = typeof req.body?.message === 'string' ? req.body.message.trim() : '';
  if (!trimmed) {
    return res.status(400).json({ error: 'Message cannot be empty' });
  }

  try {
    const existing: any = await db.get('SELECT * FROM queries WHERE id = ?', req.params.id);
    if (!existing) return res.status(404).json({ error: 'Message not found' });
    if (!canManageQuery(req.user, existing)) {
      return res.status(403).json({ error: 'You can only edit your own messages' });
    }

    await db.run('UPDATE queries SET message = ? WHERE id = ?', trimmed, req.params.id);
    res.json({ id: Number(req.params.id), message: trimmed });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update message' });
  }
};

export const deleteQuery = async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const existing: any = await db.get('SELECT * FROM queries WHERE id = ?', req.params.id);
    if (!existing) return res.status(404).json({ error: 'Message not found' });
    if (!canManageQuery(req.user, existing)) {
      return res.status(403).json({ error: 'You can only delete your own messages' });
    }

    await db.run('DELETE FROM queries WHERE id = ?', req.params.id);
    res.json({ deleted: true, id: Number(req.params.id) });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete message' });
  }
};
