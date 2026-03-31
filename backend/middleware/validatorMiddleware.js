const { validationResult } = require('express-validator');

/**
 * Middleware di Validazione Atomica
 * Raccoglie i risultati di express-validator e restituisce errore 422 se presenti.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }
  
  const extractedErrors = [];
  errors.array().map(err => extractedErrors.push({ [err.path]: err.msg }));

  return res.status(422).json({
    error: 'Protocollo di validazione fallito.',
    details: extractedErrors
  });
};

module.exports = { validate };
