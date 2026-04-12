const request = require( 'supertest' );
const app = require( '../app' );
const { connectTestDB, closeTestDB, clearDatabase } = require( './setup' );
const User = require( '../models/User' );
const Deck = require( '../models/Deck' );

let authToken;
let userId;

beforeAll( async () => {
    await connectTestDB();
    // Create and verify a test user, then obtain login token
    await request( app )
        .post( '/api/v1/auth/register' )
        .send( {
            username: 'DeckOwner',
            email: 'owner@example.com',
            password: 'password123'
        } );

    const createdUser = await User.findOne( { email: 'owner@example.com' } );
    await request( app ).get( `/api/v1/auth/verify/${createdUser.verificationToken}` );

    const loginRes = await request( app )
        .post( '/api/v1/auth/login' )
        .send( {
            email: 'owner@example.com',
            password: 'password123'
        } );

    authToken = loginRes.body.token;
    userId = loginRes.body.id;
} );

afterAll( async () => {
    await closeTestDB();
} );

beforeEach( async () => {
    // Clear only decks, keep the user for tests
    await Deck.deleteMany( {} );
} );

describe( 'Decks API', () => {
    test( 'Should fetch public decks', async () => {
        // Create a public deck
        await Deck.create( {
            name: 'Public Deck',
            creator: 'deckowner',
            creatorName: 'DeckOwner',
            costruttoreId: 123,
            isPublic: true,
            cards: []
        } );

        const res = await request( app ).get( '/api/v1/decks/public' );
        expect( res.statusCode ).toBe( 200 );
        expect( res.body.decks.length ).toBe( 1 );
        expect( res.body.decks[0].name ).toBe( 'Public Deck' );
    } );

    test( 'Should not fetch private decks in public list', async () => {
        await Deck.create( {
            name: 'Private Deck',
            creator: 'deckowner',
            creatorName: 'DeckOwner',
            costruttoreId: 123,
            isPublic: false,
            cards: []
        } );

        const res = await request( app ).get( '/api/v1/decks/public' );
        expect( res.statusCode ).toBe( 200 );
        expect( res.body.decks.length ).toBe( 0 );
    } );

    test( 'Should create a new deck (authenticated)', async () => {
        const res = await request( app )
            .post( '/api/v1/decks' )
            .set( 'Authorization', `Bearer ${authToken}` )
            .send( {
                name: 'New Deck',
                costruttoreId: 123,
                isPublic: true,
                cards: []
            } );

        expect( res.statusCode ).toBe( 201 );
        expect( res.body.name ).toBe( 'New Deck' );
    } );

    test( 'Should fail to create deck without token', async () => {
        const res = await request( app )
            .post( '/api/v1/decks' )
            .send( {
                name: 'Unauthorized Deck',
                isPublic: true,
                cards: []
            } );

        expect( res.statusCode ).toBe( 401 );
    } );
} );
