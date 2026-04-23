import request from 'supertest';
import app from '../app';
import { connectTestDB, closeTestDB, clearDatabase } from './setup';
import News from '../models/News';

/**
 * SEO Controller Tests
 *
 * Verifies that the sitemap endpoint generates valid XML containing
 * static pages and dynamic news slugs for search crawler ingestion.
 */

beforeAll(async () => {
    await connectTestDB();
});

afterAll(async () => {
    await closeTestDB();
});

beforeEach(async () => {
    await clearDatabase();
});

describe('SEO API — Sitemap', () => {
    test('Should return 200 with XML content-type', async () => {
        const res = await request(app).get('/api/v1/seo/sitemap.xml');

        expect(res.statusCode).toBe(200);
        expect(res.headers['content-type']).toMatch(/xml/);
    });

    test('Should contain static core pages in the sitemap', async () => {
        const res = await request(app).get('/api/v1/seo/sitemap.xml');

        expect(res.text).toContain('<urlset');
        expect(res.text).toContain('joule-zeropoint.com');
        expect(res.text).toContain('/news');
        expect(res.text).toContain('/rules');
    });

    test('Should include published news slugs in the sitemap', async () => {
        await News.create({
            slug: 'avventura-temporale',
            title: 'Avventura Temporale',
            summary: 'Una storia epica',
            content: 'Corpo della storia.',
            category: 'storia',
            isPublished: true,
        });

        const res = await request(app).get('/api/v1/seo/sitemap.xml');

        expect(res.statusCode).toBe(200);
        expect(res.text).toContain('/news/avventura-temporale');
    });

    test('Should not include unpublished articles in the sitemap', async () => {
        await News.create({
            slug: 'bozza-segreta',
            title: 'Bozza',
            summary: 'Non pubblicata',
            content: 'Corpo.',
            isPublished: false,
        });

        const res = await request(app).get('/api/v1/seo/sitemap.xml');

        expect(res.text).not.toContain('/news/bozza-segreta');
    });
});
