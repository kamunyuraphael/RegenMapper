import { Router } from 'express';
import {
  signup,
  login,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  getMe,
  updateMe,
} from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', requireAuth, resendVerification);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/me', requireAuth, getMe);
router.put('/me', requireAuth, updateMe);

export default router;
