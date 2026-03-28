import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  createChat,
  getChats,
  deleteChat,
  getChatMessages,
  createMessage,
} from '../controllers/chatController.js';

const router = express.Router();

router.route('/').post(protect, createChat).get(protect, getChats);
router.route('/:chatId').delete(protect, deleteChat);
router.route('/:chatId/messages').get(protect, getChatMessages).post(protect, createMessage);

export default router;