import request from 'supertest';
import app from '../app';
import { connectTestDB, closeTestDB, clearDatabase } from './setup';
import Card from '../models/Card';
import { clearCache } from '../services/cardService';

/**
 * Card API Tests
 *
 * Verifies the card catalog endpoint and the caching layer behavior.
 * Cards are public — no authentication required.
 */

beforeAll(async () => {
    await connectTestDB();
});

afterAll(async () => {
    await closeTestDB();
});

beforeEach(async () => {
    await clearDatabase();
    clearCache();
});

const seedCards = () =>
    Card.insertMany([
        { cardId: 1, name: 'Accumulatore Solare', type: 'ENTITÀ', rarity: 'Comune', cost_et: 2 },
        { cardId: 2, name: 'Risonanza Temporale', type: 'EVENTO', rarity: 'Raro', cost_et: 4 },
        { cardId: 3, name: 'Scudo Entropico', type: 'EQUIPAGGIAMENTO', rarity: 'Comune', cost_et: 1 },
    ]);

describe('Card API — Catalog Retrieval', () => {
    test('Should return an empty array when no cards are seeded', async () => {
        const res = await request(app).get('/api/v1/cards');

        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual([]);
    });

    test('Should return all seeded cards', async () => {
        await seedCards();

        const res = await request(app).get('/api/v1/cards');

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveLength(3);
    });

    test('Should return cards sorted by cardId ascending', async () => {
        await seedCards();

        const res = await request(app).get('/api/v1/cards');

        expect(res.statusCode).toBe(200);
        const ids = res.body.map((c: { cardId: number }) => c.cardId);
        expect(ids).toEqual([1, 2, 3]);
    });

    test('Should include expected card fields in the response', async () => {
        await seedCards();

        const res = await request(app).get('/api/v1/cards');

        expect(res.statusCode).toBe(200);
        const card = res.body[0];
        expect(card).toHaveProperty('name');
        expect(card).toHaveProperty('cardId');
        expect(card).toHaveProperty('type');
    });

    test('Should return the same result on a second call (cache hit)', async () => {
        await seedCards();

        const first = await request(app).get('/api/v1/cards');
        const second = await request(app).get('/api/v1/cards');

        expect(second.statusCode).toBe(200);
        expect(second.body).toHaveLength(first.body.length);
        expect(second.body[0].cardId).toBe(first.body[0].cardId);
    });
});

describe('Card Sync Webhook — Auth Guard', () => {
    test('Should reject sync without admin key (401)', async () => {
        const res = await request(app).post('/api/v1/cards/sync-webhook');

        expect(res.statusCode).toBe(401);
        expect(res.body.success).toBe(false);
    });

    test('Should reject sync with wrong admin key (401)', async () => {
        const res = await request(app)
            .post('/api/v1/cards/sync-webhook')
            .set('x-admin-key', 'chiave-sbagliata');

        expect(res.statusCode).toBe(401);
    });
});
