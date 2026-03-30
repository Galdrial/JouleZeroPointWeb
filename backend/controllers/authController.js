const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const logger = require('../config/logger');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '24h',
  });
};

// @desc    Register a new user
// @route   POST /api/v1/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Tutti i campi sono obbligatori.' });
    }

    const userExists = await User.findOne({ $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }] });

    if (userExists) {
      return res.status(409).json({ error: 'Frequenza Temporale o Username già occupati.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      username: username.toLowerCase(),
      usernameDisplay: username,
      email: email.toLowerCase(),
      password: hashedPassword,
    });

    if (user) {
      logger.info(`SISTEMA_VIGILE: Nuovo costruttore registrato: ${username}`);
      res.status(201).json({
        id: user._id,
        username: user.usernameDisplay,
        email: user.email,
        token: generateToken(user._id),
      });
    }
  } catch (error) {
    logger.error(`ERRORE_REGISTRAZIONE: ${error.message}`);
    res.status(500).json({ error: 'Errore durante la codifica genetica del profilo.' });
  }
};

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });

    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({
        id: user._id,
        username: user.usernameDisplay || user.username,
        email: user.email,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ error: 'Credenziali non valide. Sincronizzazione fallita.' });
    }
  } catch (error) {
    logger.error(`ERRORE_LOGIN: ${error.message}`);
    res.status(500).json({ error: 'Errore di sistema durante l\'accesso.' });
  }
};

// @desc    Delete user account
// @route   DELETE /api/v1/users/profile
// @access  Private/Protected
const deleteAccount = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      await User.deleteOne({ _id: req.user._id });
      logger.info(`SISTEMA_VIGILE: Account epurato: ${user.username}`);
      res.json({ message: 'Dati genetici rimossi con successo dall\'archivio centrale.' });
    } else {
      res.status(404).json({ error: 'Utente non trovato.' });
    }
  } catch (error) {
    logger.error(`ERRORE_DELETE: ${error.message}`);
    res.status(500).json({ error: 'Errore durante l\'epurazione.' });
  }
};

module.exports = {
  registerUser,
  loginUser,
  deleteAccount,
};
