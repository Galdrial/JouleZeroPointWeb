const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const logger = require('../config/logger');

/**
 * Utility for generating session access tokens.
 * Issues a JWT signed with the environment secret, valid for a 24-hour window.
 * 
 * @param {string} id - The Unique Identifier of the user entity.
 * @returns {string} - The encoded JWT token.
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '24h',
  });
};

/**
 * @desc    Register a new developer/user profile
 * @route   POST /api/v1/auth/register
 * @access  Public
 * @protocol Atomic creation with password hashing and duplicate checks.
 */
const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields are mandatory.' });
    }

    // Check for collision in the identity registry (email or username)
    const userExists = await User.findOne({ $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }] });

    if (userExists) {
      return res.status(409).json({ error: 'Temporal Frequency or Username already occupied.' });
    }

    // Security Tier: Implement adaptive salt generation for the credential hash
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      username: username.toLowerCase(),
      usernameDisplay: username,
      email: email.toLowerCase(),
      password: hashedPassword,
    });

    if (user) {
      logger.info(`VIGIL_SYSTEM: New constructor registered: ${username}`);
      res.status(201).json({
        id: user._id,
        username: user.usernameDisplay,
        email: user.email,
        token: generateToken(user._id),
      });
    }
  } catch (error) {
    logger.error(`REGISTRATION_ERROR: ${error.message}`);
    res.status(500).json({ error: 'Error during genetic profile encoding.' });
  }
};

/**
 * @desc    Authenticate user and retrieve session token
 * @route   POST /api/v1/auth/login
 * @access  Public
 * @protocol Credential verification via bcrypt comparison against the secure database.
 */
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });

    // Compare provided credential with the stored hash
    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({
        id: user._id,
        username: user.usernameDisplay || user.username,
        email: user.email,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ error: 'Invalid credentials. Synchronization failed.' });
    }
  } catch (error) {
    logger.error(`LOGIN_ERROR: ${error.message}`);
    res.status(500).json({ error: 'System error during access protocol.' });
  }
};

/**
 * @desc    Purge user account and associated data
 * @route   DELETE /api/v1/users/profile
 * @access  Private/Protected
 * @protocol Permanent removal of identity data from the central archive.
 */
const deleteAccount = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      await User.deleteOne({ _id: req.user._id });
      logger.info(`VIGIL_SYSTEM: Account purged: ${user.username}`);
      res.json({ message: 'Genetic data successfully removed from the central archive.' });
    } else {
      res.status(404).json({ error: 'Constructor not found.' });
    }
  } catch (error) {
    logger.error(`DELETE_ERROR: ${error.message}`);
    res.status(500).json({ error: 'Error during purge sequence.' });
  }
};

module.exports = {
  registerUser,
  loginUser,
  deleteAccount,
};
