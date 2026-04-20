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
    body('privacyConsent').isBoolean().equals('true').withMessage('Il consenso alla Privacy Policy è obbligatorio'),
  ],
  submitContactForm
);

export default router;
