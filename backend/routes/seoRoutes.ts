import express from 'express';
import * as seoController from '../controllers/seoController';

const router = express.Router();

/**
 * SEO Route: Discovery engine for search crawlers.
 * In a real production environment, the main entry point (e.g., Nginx or reverse proxy)
 * should route /sitemap.xml to this internal endpoint.
 */
router.get('/sitemap.xml', seoController.getSitemap);

export default router;
