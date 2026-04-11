const multer = require('multer');
const path = require('path');
const fs = require('fs');

/**
 * multer.js: Asset Persistence Protocol
 * Manages the ingestion of media artifacts into the Matrix file system.
 * Implements disk storage with dynamic sanitization and size limiting.
 */

const BACKEND_PUBLIC_NEWS_DIR = path.join(__dirname, '../public/news');

// Ensure the target directory for artifacts is properly established
if (!fs.existsSync(BACKEND_PUBLIC_NEWS_DIR)) {
    fs.mkdirSync(BACKEND_PUBLIC_NEWS_DIR, { recursive: true });
}

/**
 * Storage Strategy: Local Matrix Disks
 * Defines the destination and nomadic identity (filename) for uploaded news assets.
 */
const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, BACKEND_PUBLIC_NEWS_DIR),
    filename: (_req, file, cb) => {
        const extension = path.extname(file.originalname || '').toLowerCase() || '.jpg';
        const sanitizedBase = path
            .basename(file.originalname || 'news-image', extension)
            .toLowerCase()
            .replace(/[^a-z0-9-_]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$|_/g, '') || 'news-image';

        // Timestamp-based synchronization to prevent identity collision
        cb(null, `${Date.now()}-${sanitizedBase}${extension}`);
    }
});

/**
 * Media Guard: Validation & Filtering
 * Filters incoming streams to ensure only authorized image formats are ingested.
 * Enforces a thermal limit on file size (4MB).
 */
const uploadNewsImage = multer({
    storage: storage,
    limits: { fileSize: 4 * 1024 * 1024 }, // 4MB Limit
    fileFilter: (_req, file, cb) => {
        if (file.mimetype && file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Asset non-compliant. Only image formats are authorized for ingestion.'));
        }
    }
});

module.exports = { uploadNewsImage };
