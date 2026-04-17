const nodemailer = require( 'nodemailer' );
const logger = require( '../config/logger' );

/**
 * Service orchestrating the delivery of transactional emails (Auth flows).
 * Configured with active Nodemailer transporter for live HTML dispatches.
 */

const transporter = nodemailer.createTransport( {
  host: process.env.SMTP_HOST || 'smtp.ionos.it',
  port: parseInt( process.env.SMTP_PORT || '587' ),
  secure: process.env.SMTP_PORT == '465', // True only for 465
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    // Crucial for shared hosting / cloud environments to avoid handshake rejection
    rejectUnauthorized: false
  },
  connectionTimeout: 15000, // Slightly more tolerance for slow cloud routes
} );

// SMTP CONNECTION VERIFICATION
// Executed on startup to provide immediate feedback in production logs.
// Skipped in test environments to avoid open TCP handles in Jest.
if ( process.env.NODE_ENV !== 'test' ) {
  transporter.verify( ( error, success ) => {
    if ( error ) {
      logger.error( `VIGIL_SYSTEM: SMTP Connection failed for ${transporter.options.host}: ${error.message}` );
    } else {
      logger.info( `VIGIL_SYSTEM: SMTP Connection established with ${transporter.options.host}. Ready for secure transmissions.` );
    }
  } );
}

const sendVerificationEmail = async ( email, token ) => {
  const frontendBase = process.env.FRONTEND_URL || 'http://localhost:5173';
  const verifyUrl = `${frontendBase}/verify-email/${token}`;

  // EMERGENCY LOG: Allows recovering the link from server logs if email delivery fails
  logger.info( `VIGIL_SYSTEM: [MANUAL_OVERRIDE] Per l'utente ${email}, link di attivazione: ${verifyUrl}` );

  if ( !process.env.SMTP_USER || !process.env.SMTP_PASS ) {
    logger.warn( "SMTP_WARNING: Credenziali mancanti. L'email non verrà inviata. Usa il link di override sopra." );
    return;
  }

  try {
    const fromAddress = process.env.EMAIL_FROM || process.env.SMTP_USER;
    const fromName = process.env.EMAIL_FROM_NAME || "Joule System";

    await transporter.sendMail( {
      from: `"${fromName}" <${fromAddress}>`,
      to: email,
      subject: "Attivazione Profilo Joule: Zero Point",
      html: `
        <div style="font-family: monospace; background: #0c121c; padding: 30px; color: #fedc68; border: 1px solid rgba(254, 220, 104, 0.3);">
          <h2 style="color: #fff; letter-spacing: 2px;">ATTIVAZIONE PROFILO JOULE</h2>
          <p>Benvenuto Costruttore.</p>
          <p>Per sincronizzare la tua frequenza temporale all'interno dell'enclave, segui questo collegamento:</p>
          <br>
          <a href="${verifyUrl}" style="background: #fedc68; color: #0c121c; padding: 12px 20px; text-decoration: none; font-weight: bold; border-radius: 4px; display: inline-block;">ATTIVA CONSOLE</a>
          <br><br><br>
          <p style="color: #666; font-size: 11px; word-break: break-all;">In caso di interferenze crittografiche, copia questo URL: ${verifyUrl}</p>
        </div>
      `,
    } );
    logger.info( `VIGIL_SYSTEM: Real Verification Email Successfully dispatched to ${email} (via ${fromAddress})` );
  } catch ( error ) {
    logger.error( `EMAIL_DISPATCH_ERROR: ${error.message} - Accertati che le variabili SMTP siano configurate e che il provider accetti connessioni esterne.` );
  }
};

const sendPasswordResetEmail = async ( email, token ) => {
  const frontendBase = process.env.FRONTEND_URL || 'http://localhost:5173';
  const resetUrl = `${frontendBase}/reset-password/${token}`;

  logger.info( `VIGIL_SYSTEM: [MANUAL_OVERRIDE] Per l'utente ${email}, link di reset: ${resetUrl}` );

  if ( !process.env.SMTP_USER || !process.env.SMTP_PASS ) {
    logger.warn( "SMTP_WARNING: Credenziali mancanti per il reset password." );
    return;
  }
  try {
    const fromAddress = process.env.EMAIL_FROM || process.env.SMTP_USER;
    const fromName = process.env.EMAIL_FROM_NAME || "Joule System";

    await transporter.sendMail( {
      from: `"${fromName}" <${fromAddress}>`,
      to: email,
      subject: "Ripristino Passphrase Joule: Zero Point",
      html: `
        <div style="font-family: monospace; background: #0c121c; padding: 30px; color: #fedc68; border: 1px solid rgba(254, 220, 104, 0.3);">
          <h2 style="color: #fff; letter-spacing: 2px;">SBLOCCO PASSPHRASE</h2>
          <p>Hai richiesto una decrittazione d'emergenza della tua chiave di sicurezza.</p>
          <p>Usa il modulo cliccando il seguente pulsante (scade entro 1 ora):</p>
          <br>
          <a href="${resetUrl}" style="background: #00f0ff; color: #0c121c; padding: 12px 20px; text-decoration: none; font-weight: bold; border-radius: 4px; display: inline-block;">IMPOSTA NUOVA CHIAVE</a>
          <br><br><br>
          <p style="color: #666; font-size: 11px;">Se non sei stato tu a effettuare la richiesta, ignora questa trasmissione. Nessun danno al tuo profilo è in corso.</p>
        </div>
      `,
    } );
    logger.info( `VIGIL_SYSTEM: Real Reset Email Successfully dispatched to ${email} (via ${fromAddress})` );
  } catch ( error ) {
    logger.error( `EMAIL_DISPATCH_ERROR: ${error.message}` );
  }
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail
};
