const cron = require('node-cron');
const fs = require('fs');
const path = require('path');
const logger = require('../config/logger');

/**
 * PROTOCOLLO BONIFICA: Gestione dei file temporanei ed esportati.
 * Esegue la scansione ogni ora e rimuove i file più vecchi di 30 minuti.
 */
const initCleanupTask = () => {
  // Esecuzione ogni minuto (per test e maggiore reattività) oppure ogni ora?
  // Impostiamo ogni ora per performance, ma verifichiamo mtime.
  cron.schedule('0 * * * *', () => {
    logger.info('SISTEMA_VIGILE: Avvio protocollo di bonifica file temporanei...');

    const directories = [
      path.join(__dirname, '../exports'),
      path.join(__dirname, '../tmp')
    ];

    const NOW = Date.now();
    const EXPIRY_MS = 30 * 60 * 1000; // 30 minuti

    directories.forEach(dir => {
      if (!fs.existsSync(dir)) return;

      fs.readdir(dir, (err, files) => {
        if (err) {
          logger.error(`ERRORE_BONIFICA: Impossibile leggere directory ${dir}: ${err.message}`);
          return;
        }

        files.forEach(file => {
          // Ignoriamo .gitignore o file di sistema se presenti
          if (file === '.gitignore') return;

          const filePath = path.join(dir, file);
          fs.stat(filePath, (err, stats) => {
            if (err) {
              logger.error(`ERRORE_BONIFICA: Impossibile leggere stat per ${file}: ${err.message}`);
              return;
            }

            const age = NOW - stats.mtimeMs;
            if (age > EXPIRY_MS) {
              fs.unlink(filePath, (err) => {
                if (err) {
                  logger.error(`ERRORE_BONIFICA: Fallimento eliminazione ${file}: ${err.message}`);
                } else {
                  logger.info(`BONIFICA_COMPLETATA: Rimosso file obsoleto: ${file}`);
                }
              });
            }
          });
        });
      });
    });
  });

  logger.info('SISTEMA_VIGILE: Protocollo Bonifica Inizializzato (Hourly Scan).');
};

module.exports = initCleanupTask;
