import multer, { FileFilterCallback } from 'multer';
import { Request } from 'express';
import path from 'path';
import crypto from 'crypto';

/**
 * Asset Acquisition Infrastructure (TypeScript).
 * 
 * Orchestrates file uploads using Multer.
 * Configured for ephemeral local storage (public/news) as a buffer 
 * before cloud synchronization (Cloudinary).
 */

const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
    // Files are initially captured in the public news matrix
    cb(null, 'public/news');
  },
  filename: (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
    // Cryptographic Naming: Prevents collisions and obscures original metadata
    const uniqueSuffix = crypto.randomBytes(8).toString('hex');
    cb(null, `${Date.now()}-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  // Integrity Protocol: Only allows visual assets (images)
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

/**
 * Specialized Multer instance for News Imagery.
 * Constraints: 4MB limit per asset node.
 */
export const uploadNewsImage = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 4 * 1024 * 1024 }, // 4MB threshold
});
