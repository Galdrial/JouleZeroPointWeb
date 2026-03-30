const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Il nome utente è obbligatorio'],
    unique: true,
    trim: true,
    lowercase: true,
  },
  usernameDisplay: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'L\'email è obbligatoria'],
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: [true, 'La password è obbligatoria'],
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('User', userSchema);
