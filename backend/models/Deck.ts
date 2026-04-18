import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Interface representing the Deck entity for type safety and tactical collection management.
 * Extends Mongoose Document to inherit database-specific properties.
 */
export interface IDeck extends Document {
  name: string;
  creator: string;
  cards: any[]; // Flexible array for card snapshots or IDs
  costruttoreId: number;
  isPublic: boolean;
  parentDeckId?: string | null;
  votes: string[];
  importsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const deckSchema: Schema = new Schema({
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
    type: [Schema.Types.Mixed],
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

const Deck: Model<IDeck> = mongoose.models.Deck || mongoose.model<IDeck>('Deck', deckSchema);

export default Deck;
