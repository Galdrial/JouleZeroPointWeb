const jwt = require('jsonwebtoken');
const logger = require('../config/logger');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Get user from the token
            req.user = await User.findById(decoded.id).select('-password');
            
            if (!req.user) {
                return res.status(401).json({ error: 'Utente non trovato.' });
            }

            next();
        } catch (error) {
            logger.error(`ERRORE_AUTH: Token non valido: ${error.message}`);
            res.status(401).json({ error: 'Accesso negato. Token non valido o scaduto.' });
        }
    }

    if (!token) {
        return res.status(401).json({ error: 'Accesso negato. Nessun token fornito.' });
    }
};

const optionalProtect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select('-password');
        } catch (error) {
            // Token is invalid - we just continue as anonymous
            logger.debug(`OPTIONAL_AUTH: Token non valido o scaduto: ${error.message}`);
        }
    }
    next();
};

module.exports = { protect, optionalProtect };
