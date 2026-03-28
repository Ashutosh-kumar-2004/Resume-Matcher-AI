import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      trim: true,
      default: 'New Chat',
      maxlength: [120, 'Chat title cannot be more than 120 characters'],
    },
    fileCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastMessageAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

chatSchema.index({ user: 1, createdAt: 1 });

const Chat = mongoose.model('Chat', chatSchema);

export default Chat;