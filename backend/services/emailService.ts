import nodemailer from 'nodemailer';
import logger from '../config/logger';

/**
 * Service orchestrating the delivery of transactional emails (Auth flows).
 * Configured with active Nodemailer transporter for live HTML dispatches.
 */

interface SMTPTransportOptions {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string | undefined;
    pass: string | undefined;
  };
  tls: {
    rejectUnauthorized: boolean;
  };
  connectionTimeout: number;
}

const transportOptions: SMTPTransportOptions = {
  host: process.env.SMTP_HOST || 'smtp.ionos.it',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false
  },
  connectionTimeout: 15000,
};

const transporter = nodemailer.createTransport(transportOptions as any);

// SMTP CONNECTION VERIFICATION
if (process.env.NODE_ENV !== 'test') {
  transporter.verify((error: Error | null) => {
    if (error) {
      logger.error(`VIGIL_SYSTEM: SMTP Connection failed for ${transportOptions.host}: ${error.message}`);
    } else {
      logger.info(`VIGIL_SYSTEM: SMTP Connection established with ${transportOptions.host}. Ready for secure transmissions.`);
    }
  });
}

/**
 * Sends a profile activation email to the user.
 * 
 * @param email - Target recipient address.
 * @param token - Unique activation magic token.
 */
export const sendVerificationEmail = async (email: string, token: string): Promise<void> => {
  const frontendBase = process.env.FRONTEND_URL || 'http://localhost:5173';
  const verifyUrl = `${frontendBase}/verify-email/${token}`;

  logger.info(`VIGIL_SYSTEM: [MANUAL_OVERRIDE] For user ${email}, activation link: ${verifyUrl}`);

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    logger.warn("SMTP_WARNING: Missing credentials. Email will not be sent. Use the override link above.");
    return;
  }

  try {
    const fromAddress = process.env.EMAIL_FROM || process.env.SMTP_USER;
    const fromName = process.env.EMAIL_FROM_NAME || "Joule System";

    await transporter.sendMail({
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
    });
    logger.info(`VIGIL_SYSTEM: Real Verification Email Successfully dispatched to ${email} (via ${fromAddress})`);
  } catch (error) {
    logger.error(`EMAIL_DISPATCH_ERROR: ${(error as Error).message}`);
  }
};

/**
 * Sends a password reset link to the user.
 * 
 * @param email - Target recipient address.
 * @param token - Unique reset magic token.
 */
export const sendPasswordResetEmail = async (email: string, token: string): Promise<void> => {
  const frontendBase = process.env.FRONTEND_URL || 'http://localhost:5173';
  const resetUrl = `${frontendBase}/reset-password/${token}`;

  logger.info(`VIGIL_SYSTEM: [MANUAL_OVERRIDE] For user ${email}, reset link: ${resetUrl}`);

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    logger.warn("SMTP_WARNING: Missing credentials for password reset.");
    return;
  }
  try {
    const fromAddress = process.env.EMAIL_FROM || process.env.SMTP_USER;
    const fromName = process.env.EMAIL_FROM_NAME || "Joule System";

    await transporter.sendMail({
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
    });
    logger.info(`VIGIL_SYSTEM: Real Reset Email Successfully dispatched to ${email} (via ${fromAddress})`);
  } catch (error) {
    logger.error(`EMAIL_DISPATCH_ERROR: ${(error as Error).message}`);
  }
};

/**
 * Forwards a contact form message to the administrator.
 * 
 * @param name - Sender's name.
 * @param email - Sender's email.
 * @param subject - Message subject.
 * @param message - The body of the message.
 */
export const sendContactMessage = async (name: string, email: string, subject: string, message: string): Promise<void> => {
  const adminEmail = process.env.CONTACT_RECIPIENT_EMAIL || process.env.SMTP_USER;
  
  logger.info(`VIGIL_SYSTEM: Attempting to dispatch contact signal. Recipient: ${adminEmail}`);

  if (!adminEmail) {
    logger.warn("SMTP_WARNING: Cannot send contact message, missing recipient admin email.");
    return;
  }

  try {
    const fromAddress = process.env.EMAIL_FROM || process.env.SMTP_USER;
    logger.info(`VIGIL_SYSTEM: Sending from: ${fromAddress}`);
    const fromName = "Joule Zero Point System";

    await transporter.sendMail({
      from: `"${fromName}" <${fromAddress}>`,
      to: adminEmail,
      replyTo: email,
      subject: `[JOULE CONTACT] ${subject || 'Nuovo messaggio'} da ${name}`,
      html: `
        <div style="font-family: monospace; background: #0c121c; padding: 30px; color: #00f0ff; border: 1px solid rgba(0, 240, 255, 0.3);">
          <h2 style="color: #fff; letter-spacing: 2px;">NUOVO SEGNALE CRIPTATO IN INGRESSO</h2>
          <p><strong>Identificativo (Nome):</strong> ${name}</p>
          <p><strong>Coordinate (Email):</strong> ${email}</p>
          <p><strong>Oggetto:</strong> ${subject || 'Nessun oggetto'}</p>
          <hr style="border-color: rgba(0, 240, 255, 0.3);">
          <p style="white-space: pre-wrap; color: #fff;">${message}</p>
          <br><br><br>
          <p style="color: #666; font-size: 11px;">Rispondi direttamente a questa email per contattare il costruttore.</p>
        </div>
      `,
    });
    logger.info(`VIGIL_SYSTEM: Contact message from ${email} successfully dispatched to admin.`);
  } catch (error) {
    logger.error(`CONTACT_DISPATCH_ERROR: ${(error as Error).message}`);
    throw error;
  }
};
