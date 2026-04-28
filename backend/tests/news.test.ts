import fs from 'fs';
import path from 'path';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../app';
import { connectTestDB, closeTestDB, clearDatabase } from './setup';
import News from '../models/News';
import User from '../models/User';
import { NEWS_UPLOAD_DIR } from '../config/multer';

/**
 * News API Tests
 *
 * Covers public feed retrieval (filtering, pagination, slug lookup) and
 * administrative CRUD operations protected by adminProtect middleware.
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

const seedNews = async () => {
    return News.insertMany([
        {
            slug: 'prime-onde',
            title: 'Prime Onde',
            summary: 'Riassunto primo articolo',
            content: 'Corpo del primo articolo.',
            category: 'news',
            isPublished: true,
            isFeatured: false,
        },
        {
            slug: 'lore-origini',
            title: 'Origini del Punto Zero',
            summary: 'Riassunto lore',
            content: 'Corpo lore.',
            category: 'storia',
            isPublished: true,
            isFeatured: true,
            featuredOrder: 1,
        },
        {
            slug: 'bozza-nascosta',
            title: 'Bozza non pubblicata',
            summary: 'Non visibile al pubblico',
            content: 'Corpo bozza.',
            category: 'news',
            isPublished: false,
        },
    ]);
};

const createAdminToken = async () => {
    const admin = await User.create({
        username: 'admin',
        usernameDisplay: 'Admin',
        email: 'admin@test.com',
        password: 'hashed-password',
        isVerified: true,
        isAdmin: true,
        privacyAccepted: true,
        privacyAcceptedAt: new Date(),
    });

    return jwt.sign(
        { id: admin._id },
        process.env.JWT_SECRET || 'test-secret-at-least-thirty-two-chars-long'
    );
};

describe('News API — Public Feed', () => {
    test('Should return an empty array when no news are published', async () => {
        const res = await request(app).get('/api/v1/news');

        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual([]);
    });

    test('Should return only published news', async () => {
        await seedNews();

        const res = await request(app).get('/api/v1/news');

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveLength(2);
        expect(res.body.every((n: { isPublished: boolean }) => n.isPublished)).toBe(true);
    });

    test('Should respect the limit query parameter', async () => {
        await seedNews();

        const res = await request(app).get('/api/v1/news').query({ limit: 1 });

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveLength(1);
    });

    test('Should filter news by category', async () => {
        await seedNews();

        const res = await request(app).get('/api/v1/news').query({ category: 'storia' });

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveLength(1);
        expect(res.body[0].slug).toBe('lore-origini');
    });

    test('Should not include content field in list response', async () => {
        await seedNews();

        const res = await request(app).get('/api/v1/news');

        expect(res.statusCode).toBe(200);
        res.body.forEach((n: Record<string, unknown>) => {
            expect(n).not.toHaveProperty('content');
        });
    });
});

describe('News API — Detail by Slug', () => {
    test('Should return a published news article by slug', async () => {
        await seedNews();

        const res = await request(app).get('/api/v1/news/prime-onde');

        expect(res.statusCode).toBe(200);
        expect(res.body.title).toBe('Prime Onde');
        expect(res.body).toHaveProperty('content');
    });

    test('Should return 404 for a non-existent slug', async () => {
        const res = await request(app).get('/api/v1/news/frequenza-inesistente');

        expect(res.statusCode).toBe(404);
        expect(res.body).toHaveProperty('error');
    });

    test('Should return 404 for an unpublished article accessed via slug', async () => {
        await seedNews();

        const res = await request(app).get('/api/v1/news/bozza-nascosta');

        expect(res.statusCode).toBe(404);
    });
});

describe('News API — Admin CRUD', () => {
    test('Should reject POST /news without admin token (401)', async () => {
        const res = await request(app).post('/api/v1/news').send({
            slug: 'nuovo-articolo',
            title: 'Nuovo Articolo',
            summary: 'Sommario',
            content: 'Corpo.',
        });

        expect(res.statusCode).toBe(401);
    });

    test('Should reject POST /news with non-admin token (403)', async () => {
        const user = await User.create({
            username: 'normaluser',
            usernameDisplay: 'NormalUser',
            email: 'user@test.com',
            password: 'hashed-password',
            isVerified: true,
            isAdmin: false,
            privacyAccepted: true,
            privacyAcceptedAt: new Date(),
        });
        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET || 'test-secret-at-least-thirty-two-chars-long'
        );

        const res = await request(app)
            .post('/api/v1/news')
            .set('Authorization', `Bearer ${token}`)
            .send({
                slug: 'articolo-bloccato',
                title: 'Bloccato',
                summary: 'Sommario',
                content: 'Corpo.',
            });

        expect(res.statusCode).toBe(403);
    });

    test('Should create a news article with admin token (201)', async () => {
        const token = await createAdminToken();

        const res = await request(app)
            .post('/api/v1/news')
            .set('Authorization', `Bearer ${token}`)
            .send({
                slug: 'creato-da-admin',
                title: 'Creato da Admin',
                summary: 'Sommario admin',
                content: 'Corpo articolo admin.',
            });

        expect(res.statusCode).toBe(201);
        expect(res.body.slug).toBe('creato-da-admin');
    });

    test('Should reject duplicate slug with 409', async () => {
        const token = await createAdminToken();
        await seedNews();

        const res = await request(app)
            .post('/api/v1/news')
            .set('Authorization', `Bearer ${token}`)
            .send({
                slug: 'prime-onde',
                title: 'Duplicato',
                summary: 'Sommario',
                content: 'Corpo.',
            });

        expect(res.statusCode).toBe(409);
    });

    test('Should update a news article with admin token (200)', async () => {
        const token = await createAdminToken();
        await seedNews();

        const res = await request(app)
            .put('/api/v1/news/prime-onde')
            .set('Authorization', `Bearer ${token}`)
            .send({ title: 'Prime Onde Aggiornato' });

        expect(res.statusCode).toBe(200);
        expect(res.body.title).toBe('Prime Onde Aggiornato');
    });

    test('Should return 404 when updating a non-existent article', async () => {
        const token = await createAdminToken();

        const res = await request(app)
            .put('/api/v1/news/inesistente')
            .set('Authorization', `Bearer ${token}`)
            .send({ title: 'Non esiste' });

        expect(res.statusCode).toBe(404);
    });

    test('Should delete a news article with admin token (204)', async () => {
        const token = await createAdminToken();
        await seedNews();

        const res = await request(app)
            .delete('/api/v1/news/prime-onde')
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(204);

        const deleted = await News.findOne({ slug: 'prime-onde' });
        expect(deleted).toBeNull();
    });

    test('Should return 404 when deleting a non-existent article', async () => {
        const token = await createAdminToken();

        const res = await request(app)
            .delete('/api/v1/news/inesistente')
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(404);
    });

    test('Should upload an admin news image and serve it from /news', async () => {
        const token = await createAdminToken();

        const res = await request(app)
            .post('/api/v1/news/admin/upload-image')
            .set('Authorization', `Bearer ${token}`)
            .attach('image', Buffer.from('fake-image-content'), {
                filename: 'cover.png',
                contentType: 'image/png',
            });

        expect(res.statusCode).toBe(201);
        expect(res.body.imageUrl).toContain('/news/');

        const filename = res.body.imageUrl.split('/news/')[1];
        expect(filename).toBeTruthy();

        const uploadedFilePath = path.join(NEWS_UPLOAD_DIR, filename);
        expect(fs.existsSync(uploadedFilePath)).toBe(true);

        const assetRes = await request(app).get(`/news/${filename}`);
        expect(assetRes.statusCode).toBe(200);

        fs.unlinkSync(uploadedFilePath);
    });
});
