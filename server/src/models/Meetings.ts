import { Schema, model } from 'mongoose';

const meetingSchema = new Schema({
  title: { type: String, required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  transcript: { type: String, default: '' },
  summary: { type: String, default: '' },
  actionItems: [
    {
      title: { type: String, required: true },
      assignedTo: { type: String, default: 'Unassigned' },
      completed: { type: Boolean, default: false }
    }
  ],
  keyDecisions: [{ type: String }],
  sentiment: { 
    type: String, 
    enum: ['Positive', 'Neutral', 'Negative'], 
    default: 'Neutral' 
  },
  createdAt: { type: Date, default: Date.now }
});

export const Meeting = model('Meeting', meetingSchema);