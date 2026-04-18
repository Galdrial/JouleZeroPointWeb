import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Interface representing the News entity for type safety in publication and lore dissemination.
 * Extends Mongoose Document to inherit database-specific properties.
 */
export interface INews extends Document {
  slug: string;
  title: string;
  summary: string;
  content: string;
  category: 'news' | 'storia';
  imageUrl: string;
  sourceUrl?: string;
  publishedAt: Date;
  isPublished: boolean;
  isFeatured: boolean;
  featuredOrder?: number | null;
  embedding: number[];
  createdAt: Date;
  updatedAt: Date;
}

const newsSchema: Schema = new Schema({
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
  embedding: {
    type: [Number], // Vector representation for semantic search
    default: [],
    index: false,
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

const News: Model<INews> = mongoose.models.News || mongoose.model<INews>('News', newsSchema);

export default News;
