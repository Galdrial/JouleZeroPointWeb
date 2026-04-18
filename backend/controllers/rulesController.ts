import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import logger from '../config/logger';

/**
 * Rules Controller (TypeScript).
 * 
 * Orchestrates the generation and distribution of the official game rules.
 * Leverages an external Python-based deckbuilder script to synthesize 
 * the regulatory PDF from the primary ruleset.
 */

export const downloadRules = async (req: Request, res: Response) => {
  try {
    const backendDir = path.join(__dirname, '../../backend');
    const scriptPath = path.join(backendDir, '../deckbuilder.py');
    const exportsDir = path.join(backendDir, 'exports');
    const outputPath = path.join(exportsDir, 'regolamento_joule.pdf');

    // Lifecycle: Ensure ephemeral directory exists
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true });
    }

    // Dynamic Execution Environment: Use python3 (Production) or local venv
    let pythonPath = 'python3';
    const localVenv = path.join(backendDir, '../venv/bin/python3');
    if (fs.existsSync(localVenv)) {
      pythonPath = localVenv;
    }

    logger.info(`VIGIL_SYSTEM: Rules PDF synthesis initiated using ${pythonPath}`);

    // Command: python deckbuilder.py rules
    exec(`${pythonPath} ${scriptPath} rules`, (error, stdout, stderr) => {
      if (error) {
        logger.error(`RULES_PDF_ERROR: ${error.message}`);
        return res.status(500).json({ error: 'Errore durante la generazione del PDF delle regole.' });
      }

      if (!fs.existsSync(outputPath)) {
        logger.error(`RULES_PDF_NOT_FOUND: ${outputPath}`);
        return res.status(500).json({ error: 'File PDF del regolamento non generato.' });
      }

      res.download(outputPath, 'Regolamento_Joule_Zero_Point.pdf', (err) => {
        if (err) {
          logger.error(`RULES_DOWNLOAD_ERROR: ${err.message}`);
        }
      });
    });
  } catch (error) {
    logger.error(`RULES_EXPORT_PROTOCOL_ERROR: ${(error as Error).message}`);
    res.status(500).json({ error: 'Fallimento imprevisto durante l\'esportazione del regolamento.' });
  }
};
