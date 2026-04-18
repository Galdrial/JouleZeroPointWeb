import fs from 'fs';
import axios from 'axios';

// --- CONFIGURATION ---
const BASE_URL = 'https://joule-zeropoint.com';
const API_URL = process.env.VITE_API_URL || 'https://api.joule-zeropoint.com/api'; // Fallback for script
const OUTPUT_PATH = './public/sitemap.xml';

// Static routes of the SPA
const staticRoutes = [
  { url: '/', priority: '1.0', changefreq: 'weekly' },
  { url: '/news', priority: '0.8', changefreq: 'daily' },
  { url: '/rules', priority: '0.9', changefreq: 'monthly' },
  { url: '/deck-builder', priority: '0.7', changefreq: 'monthly' },
  { url: '/login', priority: '0.5', changefreq: 'monthly' },
];

async function generateSitemap() {
  console.log('🚀 Starting Sitemap Generation Protocol...');
  
  let dynamicRoutes = [];

  try {
    console.log(`🛰️ Fetching dynamic news entries from ${API_URL}/news...`);
    const response = await axios.get(`${API_URL}/news`);
    const newsEntries = response.data;

    dynamicRoutes = newsEntries.map(entry => ({
      url: `/news/${entry.slug}`,
      priority: '0.6',
      changefreq: 'monthly',
      lastmod: new Date(entry.publishedAt || Date.now()).toISOString().split('T')[0]
    }));
    
    console.log(`✅ Found ${dynamicRoutes.length} dynamic news entries.`);
  } catch (error) {
    console.error('⚠️ Warning: Could not fetch dynamic news. Static sitemap will be generated.', error.message);
  }

  const allRoutes = [...staticRoutes, ...dynamicRoutes];

  const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allRoutes.map(route => `
  <url>
    <loc>${BASE_URL}${route.url}</loc>
    ${route.lastmod ? `<lastmod>${route.lastmod}</lastmod>` : `<lastmod>${new Date().toISOString().split('T')[0]}</lastmod>`}
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`).join('')}
</urlset>`;

  try {
    fs.writeFileSync(OUTPUT_PATH, xmlContent);
    console.log(`✨ Sitemap successfully materialized at ${OUTPUT_PATH}`);
  } catch (error) {
    console.error('❌ Error writing sitemap file:', error);
  }
}

generateSitemap();
