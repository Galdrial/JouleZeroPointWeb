const jwt = require('jsonwebtoken');
const logger = require('../config/logger');
const User = require('../models/User');

/**
 * Authentication Middleware: Mandatory Guard.
 * Protects routes by verifying the JWT token provided in the Authorization header.
 * If valid, attaches the authenticated user object to req.user.
 */
const protect = async (req, res, next) => {
    let token;

    // Check for Bearer token string in incoming Authorization headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Extraction phase: Isolate the JWT from the Bearer prefix
            token = req.headers.authorization.split(' ')[1];

            // Verification phase: Decrypt and validate the signature using the Secret Signal
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Retrieval phase: Fetch the identity from the database excluding sensitive fields
            req.user = await User.findById(decoded.id).select('-password');
            
            // Integrity check: Ensure the user still exists in the system
            if (!req.user) {
                return res.status(401).json({ error: 'Identità utente non trovata nel database.' });
            }

            next();
        } catch (error) {
            // Signal Dissonance: Token is malformed, tampered with, or expired
            logger.error(`AUTH_ERROR: Invalid token signature: ${error.message}`);
            res.status(401).json({ error: 'Accesso negato. Sessione non valida o scaduta.' });
        }
    }

    // Shield active: Block request if no token was attempted
    if (!token) {
        return res.status(401).json({ error: 'Accesso negato. Nessun segnale di autenticazione fornito.' });
    }
};

/**
 * Authentication Middleware: Optional Guard.
 * Attempts to identify the user if a token is present, but allows the request to proceed
 * as anonymous if the token is missing or invalid.
 */
const optionalProtect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select('-password');
        } catch (error) {
            // Silent Dissonance: Token is invalid, but anonymous traversal is permitted
            logger.debug(`OPTIONAL_AUTH: Invalid or expired token: ${error.message}`);
        }
    }
    next();
};

module.exports = { protect, optionalProtect };
