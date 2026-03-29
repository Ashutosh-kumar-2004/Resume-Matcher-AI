import mongoose from 'mongoose';
import PDFDocument from 'pdfkit';
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

const generatePdfBufferFromText = (text) =>
  new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 48 });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(11);
    doc.text(String(text || ''), {
      width: 500,
      align: 'left',
      lineGap: 3,
    });

    doc.end();
  });

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

// @desc    Delete chat and all related messages/files from database
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

// @desc    Get extracted text content for a chat message file
// @route   GET /api/chats/:chatId/messages/:messageId/files/:fileIndex/content
// @access  Private
export const getMessageFileContent = async (req, res) => {
  try {
    const { chatId, messageId, fileIndex } = req.params;

    if (!isValidObjectId(chatId) || !isValidObjectId(messageId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid chat or message id',
      });
    }

    const numericIndex = Number(fileIndex);
    if (!Number.isInteger(numericIndex) || numericIndex < 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file index',
      });
    }

    const chat = await Chat.findOne({ _id: chatId, user: req.user.id }).lean();
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found',
      });
    }

    const message = await Message.findOne({ _id: messageId, chat: chatId, user: req.user.id }).lean();
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found',
      });
    }

    const files = Array.isArray(message.files) ? message.files : [];
    const file = files[numericIndex];
    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        fileName: file.originalName || `File ${numericIndex + 1}`,
        extractedText: file.extractedText || null,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Stream extracted file text as downloadable PDF
// @route   GET /api/chats/:chatId/messages/:messageId/files/:fileIndex/open
// @access  Private
export const openMessageFile = async (req, res) => {
  try {
    const { chatId, messageId, fileIndex } = req.params;

    if (!isValidObjectId(chatId) || !isValidObjectId(messageId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid chat or message id',
      });
    }

    const numericIndex = Number(fileIndex);
    if (!Number.isInteger(numericIndex) || numericIndex < 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file index',
      });
    }

    const chat = await Chat.findOne({ _id: chatId, user: req.user.id }).lean();
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found',
      });
    }

    const message = await Message.findOne({ _id: messageId, chat: chatId, user: req.user.id }).lean();
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found',
      });
    }

    const files = Array.isArray(message.files) ? message.files : [];
    const file = files[numericIndex];
    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found',
      });
    }

    const extractedText = String(file.extractedText || '').trim();
    if (!extractedText) {
      return res.status(404).json({
        success: false,
        message: 'No extracted text available for this file',
      });
    }

    const fileName = String(file.originalName || `file-${numericIndex + 1}.pdf`)
      .replace(/[\r\n"]/g, '')
      .trim()
      .replace(/\.[^.]+$/, '.pdf') || `file-${numericIndex + 1}.pdf`;

    const data = await generatePdfBufferFromText(extractedText);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', String(data.length));
    res.setHeader('Cache-Control', 'private, max-age=60');

    return res.status(200).send(data);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete a file from a message
// @route   DELETE /api/chats/:chatId/messages/:messageId/files/:fileIndex
// @access  Private
export const deleteMessageFile = async (req, res) => {
  try {
    const { chatId, messageId, fileIndex } = req.params;

    if (!isValidObjectId(chatId) || !isValidObjectId(messageId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid chat or message id',
      });
    }

    const numericIndex = Number(fileIndex);
    if (!Number.isInteger(numericIndex) || numericIndex < 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file index',
      });
    }

    const chat = await Chat.findOne({ _id: chatId, user: req.user.id });
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found',
      });
    }

    const message = await Message.findOne({ _id: messageId, chat: chatId, user: req.user.id });
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found',
      });
    }

    const files = Array.isArray(message.files) ? message.files : [];
    const targetFile = files[numericIndex];
    if (!targetFile) {
      return res.status(404).json({
        success: false,
        message: 'File not found',
      });
    }

    message.files.splice(numericIndex, 1);
    await message.save();

    const fileAgg = await Message.aggregate([
      { $match: { chat: new mongoose.Types.ObjectId(chatId) } },
      { $project: { fileCount: { $size: { $ifNull: ['$files', []] } } } },
      { $group: { _id: null, total: { $sum: '$fileCount' } } },
    ]);

    chat.fileCount = fileAgg?.[0]?.total || 0;
    await chat.save();

    return res.status(200).json({
      success: true,
      message: 'File deleted successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Rename chat title
// @route   PATCH /api/chats/:chatId
// @access  Private
export const updateChatTitle = async (req, res) => {
  try {
    const { chatId } = req.params;
    const nextTitle = String(req.body?.title || '').trim();

    if (!isValidObjectId(chatId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid chat id',
      });
    }

    if (!nextTitle) {
      return res.status(400).json({
        success: false,
        message: 'Chat title is required',
      });
    }

    const chat = await Chat.findOneAndUpdate(
      { _id: chatId, user: req.user.id },
      { title: nextTitle.slice(0, 120) },
      { new: true }
    );

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Chat title updated successfully',
      data: chat,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};