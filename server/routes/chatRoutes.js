import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  createChat,
  getChats,
  deleteChat,
  updateChatTitle,
  getChatMessages,
  createMessage,
  getMessageFileContent,
  deleteMessageFile,
  openMessageFile,
} from '../controllers/chatController.js';

const router = express.Router();

router.route('/').post(protect, createChat).get(protect, getChats);
router.route('/:chatId').patch(protect, updateChatTitle).delete(protect, deleteChat);
router.route('/:chatId/messages').get(protect, getChatMessages).post(protect, createMessage);
router.route('/:chatId/messages/:messageId/files/:fileIndex').delete(protect, deleteMessageFile);
router.route('/:chatId/messages/:messageId/files/:fileIndex/open').get(protect, openMessageFile);
router.route('/:chatId/messages/:messageId/files/:fileIndex/content').get(protect, getMessageFileContent);

export default router;