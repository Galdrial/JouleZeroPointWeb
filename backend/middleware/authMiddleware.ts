import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import logger from '../config/logger';
import User from '../models/User';

/**
 * Authentication Middleware: Mandatory Guard.
 * 
 * Protects routes by verifying the JWT token provided in the Authorization header.
 * Attaches the authenticated user to the Request object.
 */
export const protect = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer')) {
        const parts = authHeader.split(' ');
        
        if (parts.length !== 2) {
            return res.status(401).json({ error: 'Formato token non valido. Utilizzare Bearer [token].' });
        }

        const token = parts[1];

        try {
            if (!process.env.JWT_SECRET) {
                throw new Error('JWT_SECRET is missing from environment.');
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET) as { id: string };
            const user = await User.findById(decoded.id).select('-password');
            
            if (!user) {
                return res.status(401).json({ error: 'Identità utente non trovata nel database.' });
            }

            req.user = user;
            return next();
        } catch (error) {
            logger.error(`AUTH_ERROR: Invalid token signature: ${(error as Error).message}`);
            return res.status(401).json({ error: 'Accesso negato. Sessione non valida o scaduta.' });
        }
    }

    return res.status(401).json({ error: 'Accesso negato. Nessun segnale di autenticazione fornito.' });
};

/**
 * Authentication Middleware: Optional Guard.
 * 
 * Attempts to identify the user if a token is present, but allows the request 
 * to proceed as anonymous if the token is missing or invalid.
 */
export const optionalProtect = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer')) {
        const parts = authHeader.split(' ');
        
        if (parts.length === 2) {
            const token = parts[1];
            try {
                if (process.env.JWT_SECRET) {
                    const decoded = jwt.verify(token, process.env.JWT_SECRET) as { id: string };
                    const user = await User.findById(decoded.id).select('-password');
                    if (user) {
                        req.user = user;
                    }
                }
            } catch (error) {
                logger.debug(`OPTIONAL_AUTH: Invalid or expired token: ${(error as Error).message}`);
            }
        }
    }
    next();
};
