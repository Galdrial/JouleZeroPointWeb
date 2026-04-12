const request = require( 'supertest' );
const app = require( '../app' );
const { connectTestDB, closeTestDB, clearDatabase } = require( './setup' );
const User = require( '../models/User' );

beforeAll( async () => {
    await connectTestDB();
} );

afterAll( async () => {
    await closeTestDB();
} );

beforeEach( async () => {
    await clearDatabase();
} );

describe( 'Auth API', () => {
    const testUser = {
        username: 'TestUser',
        email: 'test@example.com',
        password: 'password123'
    };

    test( 'Should register a new user', async () => {
        const res = await request( app )
            .post( '/api/v1/auth/register' )
            .send( testUser );

        expect( res.statusCode ).toBe( 201 );
        expect( res.body ).toHaveProperty( 'message' );
    } );

    test( 'Should not register user with existing email', async () => {
        await request( app ).post( '/api/v1/auth/register' ).send( testUser );

        const res = await request( app )
            .post( '/api/v1/auth/register' )
            .send( testUser );

        expect( res.statusCode ).toBe( 200 );
        expect( res.body ).toHaveProperty( 'message' );
    } );

    test( 'Should login an existing user', async () => {
        await request( app ).post( '/api/v1/auth/register' ).send( testUser );

        const createdUser = await User.findOne( { email: testUser.email.toLowerCase() } );
        await request( app ).get( `/api/v1/auth/verify/${createdUser.verificationToken}` );

        const res = await request( app )
            .post( '/api/v1/auth/login' )
            .send( {
                email: testUser.email,
                password: testUser.password
            } );

        expect( res.statusCode ).toBe( 200 );
        expect( res.body ).toHaveProperty( 'token' );
    } );

    test( 'Should fail login with wrong password', async () => {
        await request( app ).post( '/api/v1/auth/register' ).send( testUser );

        const createdUser = await User.findOne( { email: testUser.email.toLowerCase() } );
        await request( app ).get( `/api/v1/auth/verify/${createdUser.verificationToken}` );

        const res = await request( app )
            .post( '/api/v1/auth/login' )
            .send( {
                email: testUser.email,
                password: 'wrongpassword'
            } );

        expect( res.statusCode ).toBe( 401 );
    } );
} );
