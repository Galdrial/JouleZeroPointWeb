const mongoose = require('mongoose');

/**
 * Mongoose Schema for the News entity.
 * Orchestrates the dissemination of updates, lore, and community highlights.
 * Includes slug-based routing, categorical filtering, and featured content prioritization.
 */
const newsSchema = new mongoose.Schema({
  slug: {
    type: String, // URL-friendly identifier
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
    type: String, // Rich text or markdown content of the publication
    required: [true, 'News body is mandatory'],
  },
  category: {
    type: String,
    enum: ['news', 'storia'], // 'storia' represents lore-based content
    default: 'news',
    index: true,
  },
  imageUrl: {
    type: String, // Visual hero asset for the publication
    default: '',
  },
  sourceUrl: {
    type: String, // External reference link if applicable
    default: '',
  },
  publishedAt: {
    type: Date, // Scheduled or actual publication timestamp
    default: Date.now,
    index: true,
  },
  isPublished: {
    type: Boolean, // Visibility toggle for the public feed
    default: true,
    index: true,
  },
  isFeatured: {
    type: Boolean, // Highlighted status for carousel or top-pick placement
    default: false,
    index: true,
  },
  featuredOrder: {
    type: Number, // Priority sequencing for featured items
    default: null,
  },
}, {
  // Automatic lifecycle tracking: createdAt and updatedAt timestamps
  timestamps: true,
});

/**
 * Editorial indexing for discovery.
 * Enables full-text search across titles and summaries for rapid content retrieval.
 */
newsSchema.index({ title: 'text', summary: 'text' });

module.exports = mongoose.model('News', newsSchema);
