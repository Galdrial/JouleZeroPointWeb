const jwt = require( 'jsonwebtoken' );
const logger = require( '../config/logger' );
const User = require( '../models/User' );

/**
 * Administrative Protection Middleware.
 * Verifies the JWT token and ensures the authenticated user has isAdmin privileges.
 */
const adminProtect = async ( req, res, next ) => {
    const authHeader = req.headers.authorization;

    if ( !authHeader || !authHeader.startsWith( 'Bearer' ) ) {
        return res.status( 401 ).json( { error: 'Accesso negato. Autenticazione richiesta.' } );
    }

    try {
        const token = authHeader.split( ' ' )[1];
        const decoded = jwt.verify( token, process.env.JWT_SECRET );
        req.user = await User.findById( decoded.id ).select( '-password' );

        if ( !req.user ) {
            return res.status( 401 ).json( { error: 'Identità utente non trovata.' } );
        }

        if ( !req.user.isAdmin ) {
            logger.warn( `ACCESS_DENIED: Non-admin access attempt by "${req.user.username}" from IP ${req.ip}` );
            return res.status( 403 ).json( { error: 'Accesso negato. Privilegi amministrativi richiesti.' } );
        }

        next();
    } catch ( error ) {
        logger.error( `ADMIN_AUTH_ERROR: ${error.message}` );
        return res.status( 401 ).json( { error: 'Sessione non valida o scaduta.' } );
    }
};

module.exports = { adminProtect };
