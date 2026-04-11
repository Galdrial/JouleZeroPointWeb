const cron = require('node-cron');
const fs = require('fs');
const path = require('path');
const logger = require('../config/logger');

/**
 * Cleanup Task Initialization: Automated System Sanitation.
 * Orchestrates the recurring scan and removal of ephemeral artifacts (PDF exports, temporary assets).
 * Periodicity: Hourly (0 * * * *).
 * Expiry Threshold: 30 minutes (1800000ms) based on modification time (mtime).
 */
const initCleanupTask = () => {
  // Operational Schedule: Scans target directories at the top of every hour.
  cron.schedule('0 * * * *', () => {
    logger.info('SANITY_MONITOR: Initiating automated cleanup protocol for temporary sectors...');

    const directories = [
      path.join(__dirname, '../exports'),
      path.join(__dirname, '../tmp')
    ];

    const NOW = Date.now();
    const EXPIRY_MS = 30 * 60 * 1000; // 30-minute thermal limit for artifacts

    directories.forEach(dir => {
      // Guard Check: Ensure the target sector exists before scanning
      if (!fs.existsSync(dir)) return;

      fs.readdir(dir, (err, files) => {
        if (err) {
          logger.error(`CLEANUP_FAILURE: Unable to access sector ${dir}: ${err.message}`);
          return;
        }

        files.forEach(file => {
          // Shield: Preserve core infrastructure files (e.g., .gitignore)
          if (file === '.gitignore') return;

          const filePath = path.join(dir, file);
          fs.stat(filePath, (err, stats) => {
            if (err) {
              logger.error(`CLEANUP_FAILURE: Unable to read file stats for ${file}: ${err.message}`);
              return;
            }

            // Calculation Phase: Compare file modification age vs expiry threshold
            const age = NOW - stats.mtimeMs;
            if (age > EXPIRY_MS) {
              fs.unlink(filePath, (err) => {
                if (err) {
                  logger.error(`CLEANUP_FAILURE: Decommissioning failed for artifact ${file}: ${err.message}`);
                } else {
                  logger.info(`CLEANUP_SUCCESS: Obsolete artifact purged: ${file}`);
                }
              });
            }
          });
        });
      });
    });
  });

  logger.info('SANITY_MONITOR: Cleanup Task protocol established (Hourly Scan).');
};

module.exports = initCleanupTask;
