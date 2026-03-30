const mongoose = require('mongoose');

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
  type: String,
  status: String,
  cost_et: Number,
  pep: Number,
  rp: Number,
  rarity: String,
  effect: String,
  role: String,
  image_url: String,
  embedding: {
    type: [Number],
    default: []
  }
}, {
  timestamps: true
});

// Index for vector search if using Atlas, or simple search
cardSchema.index({ name: 'text', effect: 'text' });

module.exports = mongoose.model('Card', cardSchema);
