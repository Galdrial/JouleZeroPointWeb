const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const logger = require('../config/logger');
const emailService = require('../services/emailService');

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
      if (userExists.isVerified === false) {
        // Soft-collision: Account registered but never activated. Resend auth email and update password.
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const salt = await bcrypt.genSalt(10);
        userExists.password = await bcrypt.hash(password, salt);
        userExists.verificationToken = verificationToken;
        await userExists.save();

        await emailService.sendVerificationEmail(userExists.email, verificationToken);
        return res.status(200).json({ message: 'Segnale rigenerato. Controlla la casella di posta per attivare l\'account.' });
      } else {
        return res.status(409).json({ error: 'Frequenza (Email) o Identificativo già occupati e attivi.' });
      }
    }

    // Security Tier: Implement adaptive salt generation for the credential hash
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const verificationToken = crypto.randomBytes(32).toString('hex');

    const user = await User.create({
      username: username.toLowerCase(),
      usernameDisplay: username,
      email: email.toLowerCase(),
      password: hashedPassword,
      verificationToken: verificationToken,
    });

    if (user) {
      logger.info(`VIGIL_SYSTEM: New constructor registered (pending config): ${username}`);
      await emailService.sendVerificationEmail(user.email, verificationToken);

      res.status(201).json({
        message: 'Credenziali accettate. Controlla la casella di posta per validare il profilo Joule.',
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
      // Gatekeeper: Reject unverified users with targeted HTTP 403 Forbidden
      if (user.isVerified === false) {
        return res.status(403).json({ error: 'Accesso negato: devi prima attivare la frequenza tramite l\'email ricevuta.' });
      }

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

/**
 * @desc    Verify constructor email via magic token
 * @route   GET /api/v1/auth/verify/:token
 * @access  Public
 */
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    const user = await User.findOne({ verificationToken: token });

    if (!user) {
      return res.status(400).json({ error: 'Gettone di attivazione non valido o scaduto.' });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    logger.info(`VIGIL_SYSTEM: Constructor verified: ${user.username}`);
    res.json({ message: 'Profilo genetico attivato con successo. Accesso consentito.' });
  } catch (error) {
    logger.error(`VERIFY_ERROR: ${error.message}`);
    res.status(500).json({ error: 'Errore di sistema durante la validazione.' });
  }
};

/**
 * @desc    Request Password Reset Link
 * @route   POST /api/v1/auth/forgot-password
 * @access  Public
 */
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Anti-enumeration safeguard: Always return success message
      return res.status(200).json({ message: 'Se la mail risulta iscritta, i parametri di recupero sono stati inviati.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    await emailService.sendPasswordResetEmail(user.email, resetToken);

    res.status(200).json({ message: 'Se la mail risulta iscritta, i parametri di recupero sono stati inviati.' });
  } catch (error) {
    logger.error(`FORGOT_PW_ERROR: ${error.message}`);
    res.status(500).json({ error: 'Errore di sistema nella generazione del recupero.' });
  }
};

/**
 * @desc    Reset Password via Magic Token
 * @route   POST /api/v1/auth/reset-password/:token
 * @access  Public
 */
const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ error: 'Gettone di recupero non esistente o scaduto (limite 1h).' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    logger.info(`VIGIL_SYSTEM: Constructor password reset: ${user.username}`);
    res.json({ message: 'Passphrase aggiornata con successo. Puoi ora accedere.' });
  } catch (error) {
    logger.error(`RESET_PW_ERROR: ${error.message}`);
    res.status(500).json({ error: 'Errore durante l\'aggiornamento dell\'enclave crittografica.' });
  }
};

module.exports = {
  registerUser,
  loginUser,
  deleteAccount,
  verifyEmail,
  forgotPassword,
  resetPassword,
};
