const logger = require('../config/logger');

// Protocol to sanitize CLOUDINARY_URL before the library consumes it
const sanitizeCloudinaryEnv = () => {
    if (!process.env.CLOUDINARY_URL) return false;

    try {
        let cleanUrl = process.env.CLOUDINARY_URL.trim();
        
        // Remove common copy-paste artifacts
        if (cleanUrl.includes('cloudinary://')) {
            cleanUrl = cleanUrl.substring(cleanUrl.indexOf('cloudinary://'));
        }
        
        // Remove quotes
        cleanUrl = cleanUrl.replace(/^['"]|['"]$/g, '');

        if (!cleanUrl.startsWith('cloudinary://')) {
            logger.warn("VIGIL_SYSTEM: CLOUDINARY_URL found but protocol 'cloudinary://' is missing. Disabling cloud storage.");
            delete process.env.CLOUDINARY_URL;
            return false;
        }

        // Re-inject the cleaned URL back into the environment
        process.env.CLOUDINARY_URL = cleanUrl;
        return true;
    } catch (e) {
        delete process.env.CLOUDINARY_URL;
        return false;
    }
};

// Sanitize first
const isCloudEnabled = sanitizeCloudinaryEnv();

// Require ONLY after sanitization to avoid immediate library crashes
let cloudinary = null;
if (isCloudEnabled) {
    try {
        cloudinary = require('cloudinary').v2;
        cloudinary.config({ secure: true }); // It will now use the sanitized process.env.CLOUDINARY_URL
        logger.info("VIGIL_SYSTEM: Cloudinary initialized and verified.");
    } catch (error) {
        logger.error(`VIGIL_SYSTEM: Cloudinary library failed to load: ${error.message}`);
        cloudinary = null;
    }
}

/**
 * Utility to upload a local file to Cloudinary and return the public URL.
 */
const uploadToCloudinary = async (filePath) => {
    if (!cloudinary || !process.env.CLOUDINARY_URL) {
        return null;
    }

    try {
        const result = await cloudinary.uploader.upload(filePath, {
            folder: 'joule_news',
            resource_type: 'image'
        });
        return result.secure_url;
    } catch (error) {
        logger.error(`CLOUDINARY_UPLOAD_ERROR: ${error.message}`);
        return null;
    }
};

module.exports = { uploadToCloudinary };
