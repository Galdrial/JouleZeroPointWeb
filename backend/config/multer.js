const multer = require('multer');
const path = require('path');
const fs = require('fs');

const FRONTEND_PUBLIC_NEWS_DIR = path.join(__dirname, '../../frontend/public/news');

// Ensure directory exists
if (!fs.existsSync(FRONTEND_PUBLIC_NEWS_DIR)) {
    fs.mkdirSync(FRONTEND_PUBLIC_NEWS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, FRONTEND_PUBLIC_NEWS_DIR),
    filename: (_req, file, cb) => {
        const extension = path.extname(file.originalname || '').toLowerCase() || '.jpg';
        const sanitizedBase = path
            .basename(file.originalname || 'news-image', extension)
            .toLowerCase()
            .replace(/[^a-z0-9-_]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$|_/g, '') || 'news-image';

        cb(null, `${Date.now()}-${sanitizedBase}${extension}`);
    }
});

const uploadNewsImage = multer({
    storage: storage,
    limits: { fileSize: 4 * 1024 * 1024 }, // 4MB
    fileFilter: (_req, file, cb) => {
        if (file.mimetype && file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Solo immagini consentite.'));
        }
    }
});

module.exports = { uploadNewsImage };
