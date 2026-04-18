import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Interface representing the Card entity for type safety within the backend.
 * Extends Mongoose Document to inherit database-specific properties.
 */
export interface ICard extends Document {
  cardId: number;
  name: string;
  type?: string;
  status?: string;
  cost_et?: number;
  pep?: number;
  rp?: number;
  rarity?: string;
  effect?: string;
  role?: string;
  image_url?: string;
  embedding: number[];
  id: number; // Virtual field
}

const cardSchema: Schema = new Schema({
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
  timestamps: true,
  id: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

/**
 * Compatibility Virtual: Maps Joule cardId to the 'id' field expected by the frontend.
 */
cardSchema.virtual('id').get(function(this: ICard) {
  return this.cardId;
});

cardSchema.index({ name: 'text', effect: 'text' });

const Card: Model<ICard> = mongoose.models.Card || mongoose.model<ICard>('Card', cardSchema);

export default Card;
