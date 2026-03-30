const mongoose = require('mongoose');

const newsSchema = new mongoose.Schema({
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    index: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  summary: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: [true, 'Il corpo della news è obbligatorio'],
  },
  category: {
    type: String,
    enum: ['news', 'storia'],
    default: 'news',
    index: true,
  },
  imageUrl: {
    type: String,
    default: '',
  },
  sourceUrl: {
    type: String,
    default: '',
  },
  publishedAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  isPublished: {
    type: Boolean,
    default: true,
    index: true,
  },
  isFeatured: {
    type: Boolean,
    default: false,
    index: true,
  },
  featuredOrder: {
    type: Number,
    default: null,
  },
}, {
  timestamps: true,
});

// Indexes for common queries
newsSchema.index({ title: 'text', summary: 'text' });

module.exports = mongoose.model('News', newsSchema);
