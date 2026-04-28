import { Request, Response } from 'express';
import { getPublicRulebook } from '../services/rulebookService';
import logger from '../config/logger';

export const getRulebook = (req: Request, res: Response) => {
  try {
    res.json(getPublicRulebook());
  } catch (error) {
    logger.error(`RULEBOOK_PUBLIC_ERROR: ${(error as Error).message}`);
    res.status(500).json({ error: 'Impossibile sincronizzare il regolamento ufficiale.' });
  }
};
