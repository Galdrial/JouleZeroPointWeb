const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const { validate } = require('../middleware/validatorMiddleware');
const { registerUser, loginUser, deleteAccount } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Validazione Registrazione
const registerValidation = [
  check('username', 'Lo Username è obbligatorio e deve avere almeno 3 caratteri cosmici.').notEmpty().isLength({ min: 3 }),
  check('email', 'Il segnale email è obbligatorio e deve essere valido.').notEmpty().isEmail(),
  check('password', 'La password è obbligatoria e deve avere almeno 6 frequenze.').notEmpty().isLength({ min: 6 }),
  validate
];

// Validazione Login
const loginValidation = [
  check('email', 'Email non valida o mancante.').notEmpty().isEmail(),
  check('password', 'La password è obbligatoria per la sincronia.').notEmpty(),
  validate
];

router.post('/register', registerValidation, registerUser);
router.post('/login', loginValidation, loginUser);
router.delete('/profile', protect, deleteAccount);

module.exports = router;
