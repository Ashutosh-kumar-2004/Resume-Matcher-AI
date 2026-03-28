import express from 'express';
import {
  getProfile,
  updateProfile,
  getProfileById,
  deleteProfile,
} from '../controllers/profileController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protected routes (authenticated users)
router.get('/', protect, getProfile);
router.put('/update', protect, updateProfile);
router.delete('/delete', protect, deleteProfile);

// Public route (get any user profile by ID)
router.get('/:userId', getProfileById);

export default router;
