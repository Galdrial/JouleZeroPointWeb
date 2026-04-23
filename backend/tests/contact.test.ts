import request from 'supertest';
import app from '../app';
import { connectTestDB, closeTestDB, clearDatabase } from './setup';

/**
 * Contact API Tests
 *
 * Verifies the contact form endpoint: express-validator rules and
 * successful dispatch. In NODE_ENV=test, emailService skips SMTP
 * and returns immediately — no mock required.
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

const validPayload = {
    name: 'Simone Costruttore',
    email: 'simone@example.com',
    subject: 'Segnale di Test',
    message: 'Questo è un messaggio di test dal terminale.',
    privacyConsent: true,
};

describe('Contact API — Form Submission', () => {
    test('Should accept a valid contact form and return 200', async () => {
        const res = await request(app)
            .post('/api/v1/contact')
            .send(validPayload);

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('message');
    });

    test('Should reject submission with missing name (400)', async () => {
        const res = await request(app)
            .post('/api/v1/contact')
            .send({ ...validPayload, name: '' });

        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty('errors');
    });

    test('Should reject submission with invalid email format (400)', async () => {
        const res = await request(app)
            .post('/api/v1/contact')
            .send({ ...validPayload, email: 'non-una-email' });

        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty('errors');
    });

    test('Should reject submission with missing message (400)', async () => {
        const res = await request(app)
            .post('/api/v1/contact')
            .send({ ...validPayload, message: '' });

        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty('errors');
    });

    test('Should reject submission without privacy consent (400)', async () => {
        const res = await request(app)
            .post('/api/v1/contact')
            .send({ ...validPayload, privacyConsent: false });

        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty('errors');
    });

    test('Should accept submission without subject (subject is optional)', async () => {
        const { subject: _, ...withoutSubject } = validPayload;
        const res = await request(app)
            .post('/api/v1/contact')
            .send(withoutSubject);

        expect(res.statusCode).toBe(200);
    });
});
