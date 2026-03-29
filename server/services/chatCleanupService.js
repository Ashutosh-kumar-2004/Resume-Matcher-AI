import mongoose from 'mongoose';
import Chat from '../models/Chat.js';
import Message from '../models/Message.js';

export const MAX_CHATS_PER_USER = 10;
export const MAX_FILES_PER_CHAT = 10;

const normalizeChatId = (chatId) => {
  if (!mongoose.Types.ObjectId.isValid(chatId)) {
    return null;
  }

  return new mongoose.Types.ObjectId(chatId);
};

export const deleteChatCascade = async ({ chatId, userId }) => {
  const normalizedChatId = normalizeChatId(chatId);
  if (!normalizedChatId) {
    throw new Error('Invalid chat id');
  }

  const chatFilter = { _id: normalizedChatId };
  if (userId) {
    chatFilter.user = userId;
  }

  const chat = await Chat.findOne(chatFilter).lean();
  if (!chat) {
    return {
      deleted: false,
      reason: 'Chat not found',
      filesDeleted: 0,
      messagesDeleted: 0,
      fileDeletionFailures: [],
    };
  }

  const messages = await Message.find({ chat: normalizedChatId }).lean();
  const allFiles = messages.flatMap((message) => message.files || []);

  await Message.deleteMany({ chat: normalizedChatId });
  await Chat.deleteOne({ _id: normalizedChatId });

  return {
    deleted: true,
    filesDeleted: allFiles.length,
    totalFilesInChat: allFiles.length,
    messagesDeleted: messages.length,
    fileDeletionFailures: [],
  };
};

export const enforceChatFifoLimit = async (userId) => {
  const totalChats = await Chat.countDocuments({ user: userId });
  if (totalChats < MAX_CHATS_PER_USER) {
    return null;
  }

  const oldestChat = await Chat.findOne({ user: userId }).sort({ createdAt: 1, _id: 1 });
  if (!oldestChat) {
    return null;
  }

  return deleteChatCascade({ chatId: oldestChat._id, userId });
};