const { validationResult } = require('express-validator');

/**
 * Atomic Validation Middleware.
 * Collects and processes the results from express-validator check chains.
 * If validation fails, it interrupts the request flow with a 422 Unprocessable Entity response.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }
  
  // Transformation phase: Extract and map errors into a structured context for the Frontend
  const extractedErrors = [];
  errors.array().map(err => extractedErrors.push({ [err.path]: err.msg }));

  return res.status(422).json({
    error: 'Validation protocol failed. Input data is non-compliant.',
    details: extractedErrors
  });
};

module.exports = { validate };
