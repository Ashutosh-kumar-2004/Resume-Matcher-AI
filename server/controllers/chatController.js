import mongoose from 'mongoose';
import Chat from '../models/Chat.js';
import Message from '../models/Message.js';
import {
  MAX_FILES_PER_CHAT,
  enforceChatFifoLimit,
  deleteChatCascade,
} from '../services/chatCleanupService.js';

const normalizeFilesPayload = (files) => {
  if (!files) {
    return [];
  }

  const rawFiles = Array.isArray(files) ? files : [files];

  return rawFiles
    .map((file) => {
      if (!file) {
        return null;
      }

      if (typeof file === 'string') {
        return {
          url: file,
          publicId: null,
          resourceType: 'raw',
          originalName: null,
        };
      }

      if (typeof file === 'object') {
        return {
          url: (file.url || '').trim(),
          publicId: (file.publicId || '').trim() || null,
          resourceType: file.resourceType || 'raw',
          originalName: (file.originalName || '').trim() || null,
        };
      }

      return null;
    })
    .filter((file) => file && file.url);
};

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// @desc    Create new chat (FIFO delete oldest chat when user already has 5 chats)
// @route   POST /api/chats
// @access  Private
export const createChat = async (req, res) => {
  try {
    const userId = req.user.id;
    const { title } = req.body;

    const deletedOldestChat = await enforceChatFifoLimit(userId);

    const chat = await Chat.create({
      user: userId,
      title: title?.trim() || 'New Chat',
    });

    return res.status(201).json({
      success: true,
      message: 'Chat created successfully',
      data: {
        chat,
        deletedOldestChat,
      },
    });
  } catch (error) {
    if (error.code === 'CLOUDINARY_DELETE_FAILED') {
      return res.status(500).json({
        success: false,
        message:
          'Unable to create a new chat because old chat file cleanup in Cloudinary failed',
        fileDeletionFailures: error.fileDeletionFailures || [],
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    List current user chats
// @route   GET /api/chats
// @access  Private
export const getChats = async (req, res) => {
  try {
    const chats = await Chat.find({ user: req.user.id }).sort({ updatedAt: -1 }).lean();

    return res.status(200).json({
      success: true,
      data: chats,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete chat and all related messages/files from cloud storage
// @route   DELETE /api/chats/:chatId
// @access  Private
export const deleteChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    if (!isValidObjectId(chatId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid chat id',
      });
    }

    const result = await deleteChatCascade({ chatId, userId: req.user.id });

    if (!result.deleted) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Chat deleted successfully',
      data: result,
    });
  } catch (error) {
    if (error.code === 'CLOUDINARY_DELETE_FAILED') {
      return res.status(500).json({
        success: false,
        message: 'Cloudinary file cleanup failed. Chat deletion aborted.',
        fileDeletionFailures: error.fileDeletionFailures || [],
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get messages for a specific chat
// @route   GET /api/chats/:chatId/messages
// @access  Private
export const getChatMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    if (!isValidObjectId(chatId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid chat id',
      });
    }

    const chat = await Chat.findOne({ _id: chatId, user: req.user.id });
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found',
      });
    }

    const messages = await Message.find({ chat: chatId }).sort({ createdAt: 1 }).lean();

    return res.status(200).json({
      success: true,
      data: messages,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Add message to chat with file cap enforcement
// @route   POST /api/chats/:chatId/messages
// @access  Private
export const createMessage = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { content = '', role = 'user', files = [] } = req.body;

    if (!isValidObjectId(chatId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid chat id',
      });
    }

    const chat = await Chat.findOne({ _id: chatId, user: req.user.id });
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found',
      });
    }

    const normalizedFiles = normalizeFilesPayload(files);

    if (!content.trim() && normalizedFiles.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message must contain text or at least one file',
      });
    }

    const nextFileCount = chat.fileCount + normalizedFiles.length;
    if (nextFileCount > MAX_FILES_PER_CHAT) {
      return res.status(400).json({
        success: false,
        message: `Each chat supports a maximum of ${MAX_FILES_PER_CHAT} files`,
      });
    }

    const message = await Message.create({
      chat: chat._id,
      user: req.user.id,
      role,
      content: content.trim(),
      files: normalizedFiles,
    });

    chat.fileCount = nextFileCount;
    chat.lastMessageAt = new Date();
    await chat.save();

    return res.status(201).json({
      success: true,
      message: 'Message created successfully',
      data: message,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};