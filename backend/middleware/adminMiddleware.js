const logger = require('../config/logger');

/**
 * Administrative Protection Middleware.
 * Verifies the presence and validity of the X-Admin-Key in the request headers.
 * Access is only permitted if the provided key matches the core configuration.
 */
const adminProtect = (req, res, next) => {
    // Environmental Check: Ensure the Atlas Admin Key is properly configured
    const adminKey = process.env.ADMIN_KEY;
    if (!adminKey) {
        logger.error('CRITICAL_SYSTEM: ADMIN_KEY is not defined in the environment configuration.');
        return res.status(503).json({ error: 'Administrative services are currently unavailable.' });
    }

    // Protocol Verification: Compare incoming header signal with the secure key
    const provided = req.headers['x-admin-key'] || '';
    if (provided !== adminKey) {
        logger.warn(`ACCESS_DENIED: Unauthorized administrative attempt detected from IP ${req.ip}`);
        return res.status(401).json({ error: 'Access denied. Missing or incorrect administrative key.' });
    }

    // Handshake Successful: Proceed to protected operational logic
    next();
};

module.exports = { adminProtect };
