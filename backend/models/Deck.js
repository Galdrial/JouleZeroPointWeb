const mongoose = require('mongoose');

/**
 * Mongoose Schema for the Deck entity.
 * Represents a tactical card collection created by a user.
 * Supports privacy settings, voting mechanisms, and inheritance for deck cloning/forking.
 */
const deckSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Deck name is mandatory'],
    trim: true,
  },
  creator: {
    type: String, // Username of the creator
    required: true,
    index: true,
    lowercase: true,
    trim: true,
  },
  // Collection of cards within the deck. 
  // Uses Mixed type to allow flexible card object snapshots or references.
  cards: {
    type: [mongoose.Schema.Types.Mixed],
    default: [],
  },
  // Identifier matching the user's numeric sequence
  costruttoreId: {
    type: Number,
    required: true,
  },
  // Visibility status: true makes the deck appear in the Global Database
  isPublic: {
    type: Boolean,
    default: false,
    index: true,
  },
  // Tracking if this deck was cloned or imported from another source
  parentDeckId: {
    type: String,
    default: null,
  },
  // User interaction metadata: collection of usernames who provided an upvote
  votes: {
    type: [String],
    default: [],
  },
  // Engagement metrics: total times this deck was exported/imported by other players
  importsCount: {
    type: Number,
    default: 0,
  },
}, {
  // Automatic lifecycle tracking: createdAt and updatedAt timestamps
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

/**
 * Tactical indexing for discovery.
 * Enables text search functionality for both deck names and creators.
 */
deckSchema.index({ name: 'text', creator: 'text' });

module.exports = mongoose.model('Deck', deckSchema);
