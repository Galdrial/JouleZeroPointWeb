const mongoose = require('mongoose');

/**
 * Mongoose Schema for the Message entity.
 * Persists interactions between the user and the Oracle AI Assistant.
 * Stores content, sender roles, and timestamps for dialogue history retrieval.
 */
const messageSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId, // Link to the originating user
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

module.exports = mongoose.model('Message', messageSchema);
