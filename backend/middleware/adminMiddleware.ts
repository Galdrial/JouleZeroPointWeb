import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import logger from '../config/logger';
import User from '../models/User';

/**
 * Administrative Protection Middleware (TypeScript).
 * 
 * Verifies the JWT token and ensures the authenticated user has isAdmin privileges.
 * Acts as a secondary high-clearance shield for sensitive registry operations.
 */
export const adminProtect = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer')) {
        return res.status(401).json({ error: 'Accesso negato. Autenticazione richiesta.' });
    }

    try {
        const token = authHeader.split(' ')[1];
        if (!process.env.JWT_SECRET) {
            throw new Error('JWT_SECRET is missing from environment.');
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET) as { id: string };
        const user = await User.findById(decoded.id).select('-password');

        if (!user) {
            return res.status(401).json({ error: 'Identità utente non trovata.' });
        }

        if (!user.isAdmin) {
            logger.warn(`ACCESS_DENIED: Non-admin access attempt by "${user.username}" from IP ${req.ip}`);
            return res.status(403).json({ error: 'Accesso negato. Privilegi amministrativi richiesti.' });
        }

        req.user = user;
        next();
    } catch (error) {
        logger.error(`ADMIN_AUTH_ERROR: ${(error as Error).message}`);
        return res.status(401).json({ error: 'Sessione non valida o scaduta.' });
    }
};
