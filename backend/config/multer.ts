import multer, { FileFilterCallback } from 'multer';
import { Request } from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

/**
 * Asset Acquisition Infrastructure (TypeScript).
 * 
 * Orchestrates file uploads using Multer.
 * Configured for ephemeral local storage (public/news) as a buffer 
 * before cloud synchronization (Cloudinary).
 */

export const NEWS_UPLOAD_DIR = path.resolve(__dirname, '..', 'public', 'news');

fs.mkdirSync(NEWS_UPLOAD_DIR, { recursive: true });

export const buildNewsImageFilename = (originalname: string): string => {
  const uniqueSuffix = crypto.randomBytes(8).toString('hex');
  return `${Date.now()}-${uniqueSuffix}${path.extname(originalname)}`;
};

export const persistNewsImageLocally = (file: Pick<Express.Multer.File, 'buffer' | 'originalname'>): string => {
  const filename = buildNewsImageFilename(file.originalname);
  const filePath = path.join(NEWS_UPLOAD_DIR, filename);
  fs.writeFileSync(filePath, file.buffer);
  return filename;
};

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
  storage: multer.memoryStorage(),
  fileFilter: fileFilter,
  limits: { fileSize: 4 * 1024 * 1024 }, // 4MB threshold
});
