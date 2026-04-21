import request from 'supertest';
import app from '../app';
import { connectTestDB, closeTestDB, clearDatabase } from './setup';

/**
 * Deck API Tests (TypeScript)
 *
 * Verifies search endpoint resilience against malformed and potentially
 * malicious regex inputs (ReDoS prevention).
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

describe('Deck Search API — Regex Shield', () => {
    const maliciousInputs = [
        '*?+',
        '((((((((((',
        '.*.*.*.*.*',
        '[a-z]+[a-z]+[a-z]+',
        '(?:a+)+',
        '\\',
        '^${}()|',
    ];

    test.each(maliciousInputs)(
        'Should not crash with regex-special input: "%s"',
        async (input) => {
            const res = await request(app)
                .get('/api/v1/decks')
                .query({ q: input });

            expect(res.statusCode).not.toBe(500);
            expect(res.body).not.toHaveProperty('stack');
        }
    );

    test('Should return empty results for non-matching escaped input', async () => {
        const res = await request(app)
            .get('/api/v1/decks')
            .query({ q: '*?+' });

        expect(res.statusCode).toBe(200);
        expect(res.body.decks).toEqual([]);
        expect(res.body.total).toBe(0);
    });
});
