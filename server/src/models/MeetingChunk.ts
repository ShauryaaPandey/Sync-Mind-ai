import { Schema, model } from 'mongoose';

const meetingChunkSchema = new Schema(
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
      required: true,
      index: true
    },
    chunkIndex: {
      type: Number,
      required: true
    },
    text: {
      type: String,
      required: true
    },
    embedding: {
      type: [Number],
      required: true
    }
  },
  {
    timestamps: true
  }
);

meetingChunkSchema.index({ meetingId: 1, userId: 1 });
meetingChunkSchema.index({ userId: 1, createdAt: -1 });

export const MeetingChunk = model('MeetingChunk', meetingChunkSchema);
