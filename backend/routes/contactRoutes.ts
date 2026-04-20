import express from 'express';
import { body } from 'express-validator';
import { submitContactForm } from '../controllers/contactController';

const router = express.Router();

/**
 * @route   POST /api/v1/contact
 * @desc    Submit contact form message to admin
 * @access  Public
 */
router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Il nome è richiesto').escape(),
    body('email').trim().isEmail().withMessage('Email non valida').normalizeEmail(),
    body('subject').optional().trim().escape(),
    body('message').trim().notEmpty().withMessage('Il messaggio è richiesto').escape(),
    body('privacyConsent').custom((value) => {
      if (value !== true && value !== 'true') {
        throw new Error('Il consenso alla Privacy Policy è obbligatorio');
      }
      return true;
    }),
  ],
  submitContactForm
);

export default router;
