import { Request, Response } from 'express';
import News from '../models/News';

/**
 * Controller dedicated to Search Engine Optimization (SEO) management.
 * Provides dynamic discovery tools like the XML Sitemap for search crawlers.
 */
export const getSitemap = async (req: Request, res: Response) => {
  try {
    // 1. Fetch all published content for indexing
    const news = await News.find({ isPublished: true })
      .select('slug updatedAt')
      .lean();

    const baseUrl = 'https://joule-zeropoint.com';
    
    // 2. Define static core pages
    const staticPages = [
      '',             // Home
      '/news',        // Hub News
      '/rules',       // Joule Rules
      '/privacy',     // Privacy Policy
    ];

    // 3. Assemble the XML structure
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    // Add static pages
    staticPages.forEach(page => {
      xml += '  <url>\n';
      xml += `    <loc>${baseUrl}${page}</loc>\n`;
      xml += '    <changefreq>weekly</changefreq>\n';
      xml += '    <priority>${page === '' ? '1.0' : '0.8'}</priority>\n';
      xml += '  </url>\n';
    });

    // Add dynamic news/stories
    news.forEach(item => {
      xml += '  <url>\n';
      xml += `    <loc>${baseUrl}/news/${item.slug}</loc>\n`;
      xml += `    <lastmod>${new Date(item.updatedAt).toISOString().split('T')[0]}</lastmod>\n`;
      xml += '    <changefreq>monthly</changefreq>\n';
      xml += '    <priority>0.6</priority>\n';
      xml += '  </url>\n';
    });

    xml += '</urlset>';

    // 4. Send with proper XML MIME type
    res.header('Content-Type', 'application/xml');
    res.status(200).send(xml);
  } catch (error) {
    console.error('Sitemap generation failure:', error);
    res.status(500).send('Error generating sitemap');
  }
};
