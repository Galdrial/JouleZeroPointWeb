const mongoose = require( 'mongoose' );

/**
 * Mongoose Schema for the User entity.
 * Defines the identity and security parameters for the Joule: Zero Point community.
 * Handles unique credentials, case-sensitive display names, and lifecycle timestamps.
 */
const userSchema = new mongoose.Schema( {
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
} );

module.exports = mongoose.model( 'User', userSchema );
