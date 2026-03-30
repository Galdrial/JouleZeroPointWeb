const logger = require('../config/logger');

const adminProtect = (req, res, next) => {
    const adminKey = process.env.ADMIN_KEY;
    if (!adminKey) {
        logger.error('SISTEMA_CRITICO: ADMIN_KEY non configurata nel file .env.');
        return res.status(503).json({ error: 'Servizio amministrativo non disponibile.' });
    }

    const provided = req.headers['x-admin-key'] || '';
    if (provided !== adminKey) {
        logger.warn(`ACCESSO_NEGATO: Tentativo di accesso admin non autorizzato da IP ${req.ip}`);
        return res.status(401).json({ error: 'Accesso negato. Chiave amministrativa errata o mancante.' });
    }

    next();
};

module.exports = { adminProtect };
