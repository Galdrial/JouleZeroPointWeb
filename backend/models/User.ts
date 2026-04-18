import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Interface representing the User entity for type safety and identity management.
 * Extends Mongoose Document to inherit database-specific properties.
 */
export interface IUser extends Document {
  id: string;
  username: string;
  usernameDisplay: string;
  email: string;
  password: string;
  isVerified: boolean;
  verificationToken?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  isAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema: Schema = new Schema({
  username: {
    type: String, // Normalized identifier for auth and linking
    required: [true, 'Username is mandatory'],
    unique: true,
    trim: true,
    lowercase: true,
  },
  usernameDisplay: {
    type: String, // Preserved casing for UI presentation
    required: true,
    trim: true,
  },
  email: {
    type: String, // Primary contact and recovery identifier
    required: [true, 'Email is mandatory'],
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String, // Bcrypt hashed credential
    required: [true, 'Password is mandatory'],
  },
  isVerified: {
    type: Boolean,
    default: false, // Prevents unregistered access
  },
  verificationToken: String,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  isAdmin: {
    type: Boolean,
    default: false,
  },
}, {
  // Automatic lifecycle tracking: createdAt and updatedAt timestamps
  timestamps: true,
});

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', userSchema);

export default User;
