const mongoose = require('mongoose');

/**
 * Mongoose Schema for the Card entity.
 * Defines the structure for the card catalog, including baseline stats, 
 * identity metadata, and vector embeddings for AI similarity search.
 */
const cardSchema = new mongoose.Schema({
  cardId: {
    type: Number,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: String, // Operation, Effect, or Status
  status: String,
  cost_et: Number, // Energy/Transfer Cost
  pep: Number, // Power/Execution Potential
  rp: Number, // Response/Reaction Points
  rarity: String,
  effect: String,
  role: String,
  image_url: String,
  embedding: {
    type: [Number],
    default: []
  }
}, {
  // Automatic lifecycle tracking: createdAt and updatedAt timestamps
  timestamps: true,
  // Disable the default 'id' virtual (ObjectID) to allow our custom 'id' (cardId) to take priority
  id: false,
  // Ensure virtuals are included in the JSON response for the frontend
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

/**
 * Compatibility Virtual: Maps Joule cardId to the 'id' field expected by the frontend.
 * Overwrites the default Mongoose ObjectID virtual to maintain system integrity.
 */
cardSchema.virtual('id').get(function() {
  return this.cardId;
});

/**
 * Tactical indexing for search discovery.
 * Enables both text search on name/effect and core ID lookup.
 */
cardSchema.index({ name: 'text', effect: 'text' });

module.exports = mongoose.model('Card', cardSchema);
