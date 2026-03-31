const nodemailer = require('nodemailer');
const logger = require('../config/logger');

/**
 * Service orchestrating the delivery of transactional emails (Auth flows).
 * Configured with active Nodemailer transporter for live HTML dispatches.
 */

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false, // TLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendVerificationEmail = async (email, token) => {
  const frontendBase = process.env.FRONTEND_URL || 'http://localhost:5173';
  const verifyUrl = `${frontendBase}/verify-email/${token}`;
  
  try {
    await transporter.sendMail({
      from: `"Joule System" <${process.env.SMTP_USER}>`,
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
    });
    logger.info(`VIGIL_SYSTEM: Real Verification Email Successfully dispatched to ${email}`);
  } catch (error) {
    logger.error(`EMAIL_DISPATCH_ERROR: ${error.message} - Accertati delle chiavi SMTP.`);
  }
};

const sendPasswordResetEmail = async (email, token) => {
  const frontendBase = process.env.FRONTEND_URL || 'http://localhost:5173';
  const resetUrl = `${frontendBase}/reset-password/${token}`;
  
  try {
    await transporter.sendMail({
      from: `"Joule System" <${process.env.SMTP_USER}>`,
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
    });
    logger.info(`VIGIL_SYSTEM: Real Reset Email Successfully dispatched to ${email}`);
  } catch (error) {
    logger.error(`EMAIL_DISPATCH_ERROR: ${error.message}`);
  }
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail
};
