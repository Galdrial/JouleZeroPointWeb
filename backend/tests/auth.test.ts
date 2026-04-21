import request from 'supertest';
import app from '../app';
import { connectTestDB, closeTestDB, clearDatabase } from './setup';
import User from '../models/User';

/**
 * Auth API Tests (TypeScript)
 * 
 * Verifies the integrity of the authentication gateway, including
 * registration, duplicate prevention, and JWT emission.
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

describe('Auth API', () => {
    const testUser = {
        username: 'TestUser',
        email: 'test@example.com',
        password: 'password123'
    };

    test('Should register a new user', async () => {
        const res = await request(app)
            .post('/api/v1/auth/register')
            .send({ ...testUser, privacyAccepted: true });

        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty('message');
    });

    test('Should not register user with existing email', async () => {
        await request(app).post('/api/v1/auth/register').send({ ...testUser, privacyAccepted: true });

        const res = await request(app)
            .post('/api/v1/auth/register')
            .send({ ...testUser, privacyAccepted: true });

        // Based on authController logic: 200 with message if user exists but not verified
        // or 400 if already exists and verified. 
        // Let's check the current behavior.
        expect(res.statusCode === 200 || res.statusCode === 400).toBeTruthy();
    });

    test('Should login an existing user', async () => {
        await request(app).post('/api/v1/auth/register').send({ ...testUser, privacyAccepted: true });

        const createdUser = await User.findOne({ email: testUser.email.toLowerCase() });
        if (!createdUser) throw new Error('User not found');
        
        // Manual verification for test
        await request(app).get(`/api/v1/auth/verify/${createdUser.verificationToken}`);

        const res = await request(app)
            .post('/api/v1/auth/login')
            .send({
                email: testUser.email,
                password: testUser.password
            });

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('token');
    });

    test('Should fail login with wrong password', async () => {
        await request(app).post('/api/v1/auth/register').send({ ...testUser, privacyAccepted: true });

        const createdUser = await User.findOne({ email: testUser.email.toLowerCase() });
        if (!createdUser) throw new Error('User not found');

        await request(app).get(`/api/v1/auth/verify/${createdUser.verificationToken}`);

        const res = await request(app)
            .post('/api/v1/auth/login')
            .send({
                email: testUser.email,
                password: 'wrongpassword'
            });

        expect(res.statusCode).toBe(401);
    });

    test('Should return 401 (not 404) for non-existent email', async () => {
        const res = await request(app)
            .post('/api/v1/auth/login')
            .send({ email: 'ghost@example.com', password: 'anypassword' });

        expect(res.statusCode).toBe(401);
    });

    test('Should return identical error message for missing email and wrong password (anti-enumeration)', async () => {
        await request(app).post('/api/v1/auth/register').send({ ...testUser, privacyAccepted: true });

        const createdUser = await User.findOne({ email: testUser.email.toLowerCase() });
        if (!createdUser) throw new Error('User not found');
        await request(app).get(`/api/v1/auth/verify/${createdUser.verificationToken}`);

        const wrongPasswordRes = await request(app)
            .post('/api/v1/auth/login')
            .send({ email: testUser.email, password: 'wrongpassword' });

        const missingEmailRes = await request(app)
            .post('/api/v1/auth/login')
            .send({ email: 'ghost@example.com', password: 'anypassword' });

        expect(wrongPasswordRes.statusCode).toBe(401);
        expect(missingEmailRes.statusCode).toBe(401);
        expect(wrongPasswordRes.body.error).toBe(missingEmailRes.body.error);
    });
});
