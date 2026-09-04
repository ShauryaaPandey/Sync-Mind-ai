import { Schema, model } from 'mongoose';

const chatMessageSchema = new Schema(
  {
    meetingId: {
      type: Schema.Types.ObjectId,
      ref: 'Meeting',
      required: true,
      index: true
    },

    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    senderName: {
      type: String,
      required: true
    },

    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000
    }
  },
  {
    timestamps: true
  }
);

chatMessageSchema.index({
  meetingId: 1,
  createdAt: 1
});

export const ChatMessage = model('ChatMessage', chatMessageSchema);