import express from 'express';
import { check } from 'express-validator';
import { validate } from '../middleware/validatorMiddleware';
import { 
  registerUser, 
  loginUser, 
  deleteAccount, 
  verifyEmail, 
  forgotPassword, 
  resetPassword, 
  resendVerificationEmail, 
  logoutUser, 
  updateProfile 
} from '../controllers/authController';
import { protect } from '../middleware/authMiddleware';

/**
 * Authentication Routes (TypeScript).
 * 
 * Orchestrates the secure pathways for user identity lifecycle management,
 * including registration, login, and profile administration.
 */

const router = express.Router();

/**
 * Registration Validation Schema
 * Ensures data integrity for new user synthesis.
 */
const registerValidation = [
  check('username', 'Username is required and must have at least 3 characters.').notEmpty().isLength({ min: 3 }),
  check('email', 'A valid email is required.').notEmpty().isEmail(),
  check('password', 'Password is required and must have at least 6 characters.').notEmpty().isLength({ min: 6 }),
  validate
];

/**
 * Login Validation Schema
 * Ensures credential presence before authentication attempt.
 */
const loginValidation = [
  check('email', 'Invalid or missing email.').notEmpty().isEmail(),
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
 * @route   GET /api/v1/auth/verify/:token
 * @desc    Email verification pathway
 * @access  Public
 */
router.get('/verify/:token', verifyEmail);

/**
 * @route   POST /api/v1/auth/forgot-password
 * @desc    Request a reset link
 * @access  Public
 */
router.post('/forgot-password', forgotPassword);

/**
 * @route   POST /api/v1/auth/reset-password/:token
 * @desc    Apply new passphrase
 * @access  Public
 */
router.post('/reset-password/:token', resetPassword);

/**
 * @route   POST /api/v1/auth/resend-verification
 * @desc    Resend the activation link
 * @access  Public
 */
router.post('/resend-verification', resendVerificationEmail);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Terminate session protocol
 * @access  Public
 */
router.post('/logout', logoutUser);

/**
 * @route   PUT /api/v1/auth/profile
 * @desc    Update user configuration (username/password)
 * @access  Private/Protected
 */
router.put('/profile', protect, updateProfile);

/**
 * @route   DELETE /api/v1/auth/profile
 * @desc    Decommission user account from the central matrix
 * @access  Private/Protected
 */
router.delete('/profile', protect, deleteAccount);

export default router;
