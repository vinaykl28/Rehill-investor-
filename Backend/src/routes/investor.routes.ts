import { Router } from 'express';
import { 
  getProjects, 
  getProjectById, 
  getNewProjects,
  getPayments,
  getInvestorLedger,
  getNotifications,
  markNotificationsRead
} from '../controllers/investor.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/investor/projects', authenticateToken, getProjects);
router.get('/investor/new-projects', authenticateToken, getNewProjects);
router.get('/investor/projects/:id', authenticateToken, getProjectById);
router.get('/investor/payments/:projectId', authenticateToken, getPayments);
router.get('/investor/ledger/:projectId', authenticateToken, getInvestorLedger);
router.get('/investor/notifications', authenticateToken, getNotifications);
router.patch('/investor/notifications/read', authenticateToken, markNotificationsRead);
router.patch('/investor/notifications/:id/read', authenticateToken, markNotificationsRead);

export default router;

