import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../app';
import { connectTestDB, closeTestDB, clearDatabase } from './setup';
import Deck from '../models/Deck';
import User from '../models/User';

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

describe('Deck Detail API — Privacy Shield', () => {
    const createUserWithToken = async (username: string) => {
        const user = await User.create({
            username: username.toLowerCase(),
            usernameDisplay: username,
            email: `${username.toLowerCase()}@example.com`,
            password: 'hashed-password',
            isVerified: true,
            privacyAccepted: true,
            privacyAcceptedAt: new Date(),
        });

        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET || 'test-secret-at-least-thirty-two-chars-long'
        );

        return { user, token };
    };

    test('Should hide a private deck from anonymous users', async () => {
        await createUserWithToken('Owner');
        const deck = await Deck.create({
            name: 'Private Timeline',
            creator: 'owner',
            cards: [],
            costruttoreId: 1,
            isPublic: false,
        });

        const res = await request(app).get(`/api/v1/decks/${deck._id}`);

        expect(res.statusCode).toBe(404);
    });

    test('Should allow the owner to retrieve a private deck', async () => {
        const { token } = await createUserWithToken('Owner');
        const deck = await Deck.create({
            name: 'Private Timeline',
            creator: 'owner',
            cards: [],
            costruttoreId: 1,
            isPublic: false,
        });

        const res = await request(app)
            .get(`/api/v1/decks/${deck._id}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.name).toBe('Private Timeline');
    });

    test('Should allow anonymous users to retrieve a public deck', async () => {
        await createUserWithToken('Owner');
        const deck = await Deck.create({
            name: 'Public Timeline',
            creator: 'owner',
            cards: [],
            costruttoreId: 1,
            isPublic: true,
        });

        const res = await request(app).get(`/api/v1/decks/${deck._id}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.name).toBe('Public Timeline');
    });
});
