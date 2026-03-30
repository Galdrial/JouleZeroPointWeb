const request = require('supertest');
const app = require('../app');
const { connectTestDB, closeTestDB, clearDatabase } = require('./setup');

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
            .send(testUser);
        
        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty('token');
        expect(res.body.username).toBe('TestUser');
    });

    test('Should not register user with existing email', async () => {
        await request(app).post('/api/v1/auth/register').send(testUser);
        
        const res = await request(app)
            .post('/api/v1/auth/register')
            .send(testUser);
        
        expect(res.statusCode).toBe(409);
    });

    test('Should login an existing user', async () => {
        await request(app).post('/api/v1/auth/register').send(testUser);
        
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
        await request(app).post('/api/v1/auth/register').send(testUser);
        
        const res = await request(app)
            .post('/api/v1/auth/login')
            .send({
                email: testUser.email,
                password: 'wrongpassword'
            });
        
        expect(res.statusCode).toBe(401);
    });
});
