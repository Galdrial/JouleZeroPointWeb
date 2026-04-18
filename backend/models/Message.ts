import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Interface representing the Message entity for type safety in AI dialogue persistence.
 * Extends Mongoose Document to inherit database-specific properties.
 */
export interface IMessage extends Document {
  userId: mongoose.Types.ObjectId;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId, // Link to the originating user
    ref: 'User',
    required: true,
    index: true
  },
  role: {
    type: String, // Identity marker for the AI context: user, assistant, or system
    enum: ['user', 'assistant', 'system'],
    required: true
  },
  content: {
    type: String, // The actual payload of the interaction
    required: true
  },
  timestamp: {
    type: Date, // Explicit chronological marker
    default: Date.now,
    index: true
  }
}, {
  // Automatic lifecycle tracking: createdAt and updatedAt timestamps
  timestamps: true
});

const Message: Model<IMessage> = mongoose.models.Message || mongoose.model<IMessage>('Message', messageSchema);

export default Message;
