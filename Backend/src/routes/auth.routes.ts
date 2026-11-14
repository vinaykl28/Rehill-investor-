import { Router } from 'express';
import { login, signup, logout, getMe, forgotPassword, resetPassword } from '../controllers/auth.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { authRateLimiter } from '../middlewares/rateLimiter.middleware.js';

const router = Router();

router.post('/login', authRateLimiter, login);
router.post('/signup', authRateLimiter, signup);
router.post('/logout', logout);
router.post('/forgot-password', authRateLimiter, forgotPassword);
router.post('/reset-password', authRateLimiter, resetPassword);
router.get('/me', authenticateToken, getMe);

export default router;

