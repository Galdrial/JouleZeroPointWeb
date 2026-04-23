import request from 'supertest';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import app from '../app';
import { connectTestDB, closeTestDB, clearDatabase } from './setup';
import User from '../models/User';

/**
 * Auth Flows Tests — Extended
 *
 * Covers the secondary authentication lifecycle: password recovery,
 * email re-verification, logout, profile update, account deletion,
 * and GDPR data export.
 * In NODE_ENV=test, emailService skips SMTP — no mock required.
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

const createVerifiedUser = async (overrides: Record<string, unknown> = {}) => {
    const salt = await bcrypt.genSalt(10);
    const user = await User.create({
        username: 'costruttore',
        usernameDisplay: 'Costruttore',
        email: 'costruttore@test.com',
        password: await bcrypt.hash('password123', salt),
        isVerified: true,
        privacyAccepted: true,
        privacyAcceptedAt: new Date(),
        ...overrides,
    });

    const token = jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET || 'test-secret-at-least-thirty-two-chars-long'
    );

    return { user, token };
};

// ---------------------------------------------------------------------------
describe('Auth — Logout', () => {
    test('Should always return 200 on logout', async () => {
        const res = await request(app).post('/api/v1/auth/logout');

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('message');
    });
});

// ---------------------------------------------------------------------------
describe('Auth — Forgot Password', () => {
    test('Should return 200 even if email is not registered (anti-enumeration)', async () => {
        const res = await request(app)
            .post('/api/v1/auth/forgot-password')
            .send({ email: 'ghost@example.com' });

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('message');
    });

    test('Should return 200 and set reset token when email exists', async () => {
        await createVerifiedUser();

        const res = await request(app)
            .post('/api/v1/auth/forgot-password')
            .send({ email: 'costruttore@test.com' });

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('message');

        const updated = await User.findOne({ email: 'costruttore@test.com' });
        expect(updated?.resetPasswordToken).toBeTruthy();
    });
});

// ---------------------------------------------------------------------------
describe('Auth — Reset Password', () => {
    test('Should reject reset with a token too short (< 8 chars)', async () => {
        const res = await request(app)
            .post('/api/v1/auth/reset-password/any-token')
            .send({ password: 'short' });

        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty('error');
    });

    test('Should reject reset with an invalid or expired token', async () => {
        const res = await request(app)
            .post('/api/v1/auth/reset-password/token-inesistente')
            .send({ password: 'nuovapassword123' });

        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty('error');
    });

    test('Should update the password with a valid reset token', async () => {
        const { user } = await createVerifiedUser();
        const resetToken = 'valid-reset-token-for-test';
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = new Date(Date.now() + 3600000);
        await user.save();

        const res = await request(app)
            .post(`/api/v1/auth/reset-password/${resetToken}`)
            .send({ password: 'nuovapassword123' });

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('message');

        const updated = await User.findById(user._id);
        expect(updated?.resetPasswordToken).toBeUndefined();
    });
});

// ---------------------------------------------------------------------------
describe('Auth — Resend Verification Email', () => {
    test('Should return 400 when email field is missing', async () => {
        const res = await request(app)
            .post('/api/v1/auth/resend-verification')
            .send({});

        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty('error');
    });

    test('Should return 404 for a non-existent user', async () => {
        const res = await request(app)
            .post('/api/v1/auth/resend-verification')
            .send({ email: 'nessuno@test.com' });

        expect(res.statusCode).toBe(404);
    });

    test('Should return 400 when the account is already verified', async () => {
        await createVerifiedUser();

        const res = await request(app)
            .post('/api/v1/auth/resend-verification')
            .send({ email: 'costruttore@test.com' });

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toMatch(/già verificato/i);
    });

    test('Should return 200 and update the token for an unverified user', async () => {
        await createVerifiedUser({ isVerified: false });

        const res = await request(app)
            .post('/api/v1/auth/resend-verification')
            .send({ email: 'costruttore@test.com' });

        expect(res.statusCode).toBe(200);
    });
});

// ---------------------------------------------------------------------------
describe('Auth — Update Profile', () => {
    test('Should return 401 without authentication token', async () => {
        const res = await request(app)
            .put('/api/v1/auth/profile')
            .send({ username: 'NuovoNome' });

        expect(res.statusCode).toBe(401);
    });

    test('Should update the display username with valid auth', async () => {
        const { token } = await createVerifiedUser();

        const res = await request(app)
            .put('/api/v1/auth/profile')
            .set('Authorization', `Bearer ${token}`)
            .send({ username: 'NuovoNome' });

        expect(res.statusCode).toBe(200);
        expect(res.body.username).toBe('NuovoNome');
        expect(res.body).toHaveProperty('token');
    });

    test('Should reject password update if new password is too short', async () => {
        const { token } = await createVerifiedUser();

        const res = await request(app)
            .put('/api/v1/auth/profile')
            .set('Authorization', `Bearer ${token}`)
            .send({ password: 'corto' });

        expect(res.statusCode).toBe(400);
    });
});

// ---------------------------------------------------------------------------
describe('Auth — Delete Account', () => {
    test('Should return 401 without authentication token', async () => {
        const res = await request(app).delete('/api/v1/auth/profile');

        expect(res.statusCode).toBe(401);
    });

    test('Should delete the account and return confirmation', async () => {
        const { token } = await createVerifiedUser();

        const res = await request(app)
            .delete('/api/v1/auth/profile')
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('message');

        const deleted = await User.findOne({ email: 'costruttore@test.com' });
        expect(deleted).toBeNull();
    });
});

// ---------------------------------------------------------------------------
describe('Auth — GDPR Data Export', () => {
    test('Should return 401 without authentication token', async () => {
        const res = await request(app).get('/api/v1/auth/export-data');

        expect(res.statusCode).toBe(401);
    });

    test('Should return the user data package as a JSON attachment', async () => {
        const { token } = await createVerifiedUser();

        const res = await request(app)
            .get('/api/v1/auth/export-data')
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(res.headers['content-disposition']).toMatch(/costruttore\.json/);
        expect(res.body).toHaveProperty('profile');
        expect(res.body).toHaveProperty('metadata');
        expect(res.body.metadata.legal_basis).toMatch(/GDPR/);
    });
});
