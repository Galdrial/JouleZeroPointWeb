const mongoose = require('mongoose');

const deckSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Il nome del mazzo è obbligatorio'],
    trim: true,
  },
  creator: {
    type: String,
    required: true,
    index: true,
    lowercase: true,
    trim: true,
  },
  cards: {
    type: [mongoose.Schema.Types.Mixed],
    default: [],
  },
  costruttoreId: {
    type: Number,
    required: true,
  },
  isPublic: {
    type: Boolean,
    default: false,
    index: true,
  },
  parentDeckId: {
    type: String,
    default: null,
  },
  votes: {
    type: [String], // Array of usernames
    default: [],
  },
  importsCount: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes for common queries
deckSchema.index({ name: 'text', creator: 'text' });

module.exports = mongoose.model('Deck', deckSchema);
