const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const { validate } = require('../middleware/validatorMiddleware');
const { registerUser, loginUser, deleteAccount } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

/**
 * Registration Validation Schema
 * Ensures data integrity for new user synthesis.
 */
const registerValidation = [
  check('username', 'Username is required and must have at least 3 cosmic characters.').notEmpty().isLength({ min: 3 }),
  check('email', 'Email signal is required and must be valid.').notEmpty().isEmail(),
  check('password', 'Password is required and must have at least 6 frequencies.').notEmpty().isLength({ min: 6 }),
  validate
];

/**
 * Login Validation Schema
 * Ensures credential presence before authentication attempt.
 */
const loginValidation = [
  check('email', 'Invalid or missing email signal.').notEmpty().isEmail(),
  check('password', 'Password is required for synchronization.').notEmpty(),
  validate
];

/**
 * @route   POST /api/v1/auth/register
 * @desc    New user registration protocol
 * @access  Public
 */
router.post('/register', registerValidation, registerUser);

/**
 * @route   POST /api/v1/auth/login
 * @desc    User authentication and JWT issuance
 * @access  Public
 */
router.post('/login', loginValidation, loginUser);

/**
 * @route   DELETE /api/v1/auth/profile
 * @desc    Decommission user account from the central matrix
 * @access  Private/Protected
 */
router.delete('/profile', protect, deleteAccount);

module.exports = router;
