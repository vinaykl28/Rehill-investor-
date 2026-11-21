import { Router } from 'express';
import {
  sendQuery,
  getInvestorQueries,
  getAdminQueryThreads,
  getAdminQueryThread,
  updateQuery,
  deleteQuery
} from '../controllers/query.controller.js';
import { authenticateToken, isAdmin } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/queries', authenticateToken, sendQuery);
router.patch('/queries/:id', authenticateToken, updateQuery);
router.delete('/queries/:id', authenticateToken, deleteQuery);
router.get('/investor/queries/:projectId', authenticateToken, getInvestorQueries);
router.get('/admin/queries', authenticateToken, isAdmin, getAdminQueryThreads);
router.get('/admin/queries/:userId/:projectId', authenticateToken, isAdmin, getAdminQueryThread);

export default router;
