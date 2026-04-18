import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationError } from 'express-validator';

/**
 * Atomic Validation Middleware (TypeScript).
 * 
 * Collects and processes the results from express-validator check chains.
 * If validation fails, it interrupts the request flow with a 422 Unprocessable Entity response.
 */
export const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }
  
  // Transformation phase: Extract and map errors into a structured context for the Frontend
  const extractedErrors: { [key: string]: string }[] = [];
  errors.array().forEach((err: ValidationError) => {
    if (err.type === 'field') {
      extractedErrors.push({ [err.path]: err.msg });
    }
  });

  return res.status(422).json({
    error: 'Validation protocol failed. Input data is non-compliant.',
    details: extractedErrors
  });
};
