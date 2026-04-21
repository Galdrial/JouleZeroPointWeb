import request from 'supertest';
import app from '../app';
import { connectTestDB, closeTestDB, clearDatabase } from './setup';

/**
 * Terminal API Tests (TypeScript)
 *
 * Verifies that the AI dialogue endpoint is accessible to anonymous users
 * and handles invalid tokens gracefully (optionalProtect — no hard 401).
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

describe('Terminal API — Access Control', () => {
    test('Should allow anonymous request (no token) — not 401', async () => {
        const res = await request(app)
            .post('/api/v1/terminal/chat')
            .send({ message: 'Ciao' });

        // Anonymous access is allowed; SSE or 400 for missing body, never 401
        expect(res.statusCode).not.toBe(401);
        expect(res.statusCode).not.toBe(403);
    });

    test('Should allow request with invalid token (optionalProtect ignores it) — not 401', async () => {
        const res = await request(app)
            .post('/api/v1/terminal/chat')
            .set('Authorization', 'Bearer token_non_valido')
            .send({ message: 'Ciao' });

        expect(res.statusCode).not.toBe(401);
        expect(res.statusCode).not.toBe(403);
    });

    test('Should reject request with missing message body — 400', async () => {
        const res = await request(app)
            .post('/api/v1/terminal/chat')
            .send({});

        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty('error');
    });
});
