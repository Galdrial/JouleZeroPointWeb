/**
 * setup.env.js — Test Environment Stubs
 *
 * This file runs via jest.config.js `setupFiles` BEFORE any module
 * is imported. It injects the minimum environment variables needed
 * to allow service modules (OpenAI, SMTP) to initialize without
 * crashing, without making real API calls.
 *
 * These are NOT real credentials — they are placeholders that
 * satisfy client constructors while keeping tests hermetic.
 */

// Required by embeddingService.js / aiService.js (OpenAI client init)
process.env.OPENAI_API_KEY   = process.env.OPENAI_API_KEY   || 'sk-test-placeholder-ci';
process.env.ASSISTANT_ID     = process.env.ASSISTANT_ID     || 'asst-test-placeholder-ci';

// Required by emailService.js (Nodemailer transporter init)
process.env.SMTP_HOST        = process.env.SMTP_HOST        || 'localhost';
process.env.SMTP_PORT        = process.env.SMTP_PORT        || '4025';
process.env.SMTP_USER        = process.env.SMTP_USER        || 'test@joule.local';
process.env.SMTP_PASS        = process.env.SMTP_PASS        || 'test-pass-ci';
process.env.EMAIL_FROM       = process.env.EMAIL_FROM       || 'noreply@joule.local';
process.env.FRONTEND_URL     = process.env.FRONTEND_URL     || 'http://localhost:5173';

// Required by auth middleware
process.env.JWT_SECRET       = process.env.JWT_SECRET       || 'test-jwt-secret-ci';

// Prevent SMTP transporter from attempting a real TCP connection during verify()
// by signalling test mode — emailService should check this before calling verify()
process.env.NODE_ENV         = 'test';
