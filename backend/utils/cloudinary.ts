import { v2 as cloudinary } from 'cloudinary';
import logger from '../config/logger';

/**
 * Cloudinary Utility (TypeScript).
 * 
 * Handles secure image uploads to cloud storage for news assets and card imagery.
 * Implements defensive environment sanitization to prevent crashes on malformed URLs.
 */

// Protocol to sanitize CLOUDINARY_URL before the library consumes it
const sanitizeCloudinaryEnv = (): boolean => {
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

if (isCloudEnabled) {
    try {
        cloudinary.config({ secure: true }); 
        logger.info("VIGIL_SYSTEM: Cloudinary initialized and verified.");
    } catch (error) {
        logger.error(`VIGIL_SYSTEM: Cloudinary initialization failed: ${(error as Error).message}`);
    }
}

export const isCloudinaryEnabled = (): boolean => {
    return isCloudEnabled && Boolean(process.env.CLOUDINARY_URL);
};

/**
 * Utility to upload an in-memory file buffer to Cloudinary and return the public URL.
 * 
 * @param fileBuffer - Raw file buffer received from Multer memory storage.
 * @returns The secure URL of the uploaded image, or null if the upload fails.
 */
export const uploadBufferToCloudinary = async (fileBuffer: Buffer): Promise<string | null> => {
    if (!isCloudinaryEnabled()) {
        return null;
    }

    try {
        const result = await new Promise<any>((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream({
                folder: 'joule_news',
                resource_type: 'image'
            }, (error, uploadResult) => {
                if (error) {
                    reject(error);
                    return;
                }

                resolve(uploadResult);
            });

            stream.end(fileBuffer);
        });

        return result.secure_url;
    } catch (error) {
        logger.error(`CLOUDINARY_UPLOAD_ERROR: ${(error as Error).message}`);
        return null;
    }
};
