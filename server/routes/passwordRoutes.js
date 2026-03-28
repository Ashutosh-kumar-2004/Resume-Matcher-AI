import express from 'express';
import {
  forgotPassword,
  resetPassword,
  validateResetToken,
  changePassword,
} from '../controllers/passwordController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Password reset routes
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.post('/validate-token/:token', validateResetToken);

// Change password route (authenticated)
router.post('/change-password', protect, changePassword);

export default router;
