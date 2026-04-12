/**
 * AI Integrity & Simulation Suite — Joule Zero Point.
 * 
 * This suite runs JSON-defined "Golden Cases" to verify
 * AI behavior stability, role adherence, and
 * injection resistance.
 */

const fs = require( 'fs' );
const path = require( 'path' );
require( 'dotenv' ).config( { path: path.join( __dirname, '../.env' ) } );

const { streamChat, buildPromptMessages } = require( '../services/aiService' );
const logger = require( '../config/logger' );

// Disable debug logs to keep test output clean
logger.transports.forEach( ( t ) => ( t.silent = true ) );

const goldenCasesPath = path.join( __dirname, 'ai-simulations', 'golden_cases.json' );
const goldenCases = JSON.parse( fs.readFileSync( goldenCasesPath, 'utf8' ) );

describe( 'AI Simulation: Joule Referee Integrity', () => {
    // Extended timeout for real AI calls
    jest.setTimeout( 45000 );

    test.each( goldenCases )( 'Simulation Case: $name ($category)', async ( scenario ) => {
        const { input, expectation } = scenario;

        // Context construction
        const promptMessages = buildPromptMessages( {
            userMessage: input,
            userRecord: null,
            userIdentity: "Ospite Esterno",
            historyMessages: [],
            totalCards: 42,
            gameState: null
        } );

        // Execute live simulation
        const responseContent = await streamChat(
            promptMessages,
            ( delta ) => { /* streaming muted */ },
            () => { /* done */ },
            ( errorMsg ) => { throw new Error( `AI_SERVICE_ERROR: ${errorMsg}` ); }
        );

        if ( responseContent === null ) {
            throw new Error( "Simulation interrupted: AI service returned no content." );
        }

        // --- PROFESSIONAL VALIDATIONS (REGEX-BASED) ---

        const contentLower = responseContent.toLowerCase();

        // 1. Non-empty and structured response
        expect( responseContent.length ).toBeGreaterThan( 20 );

        // 2. Presence of mandatory keywords/intents
        if ( expectation.contains ) {
            expectation.contains.forEach( term => {
                // If the term starts with "/", treat it as a regex
                const isRegex = term.startsWith( '/' ) && term.endsWith( '/' );
                if ( isRegex ) {
                    const regex = new RegExp( term.slice( 1, -1 ), 'i' );
                    const match = regex.test( responseContent );
                    if ( !match ) {
                        console.error( `REGEX FAILURE: ${scenario.name}\nMissing pattern: ${term}\nAI response: "${responseContent}"` );
                    }
                    expect( responseContent ).toMatch( regex );
                } else {
                    const found = contentLower.includes( term.toLowerCase() );
                    if ( !found ) {
                        console.error( `TERM FAILURE: ${scenario.name}\nMissing term: "${term}"\nAI response: "${responseContent}"` );
                    }
                    expect( contentLower ).toContain( term.toLowerCase() );
                }
            } );
        }

        // 3. Absence of forbidden terms
        if ( expectation.must_not_contain ) {
            expectation.must_not_contain.forEach( term => {
                const found = contentLower.includes( term.toLowerCase() );
                if ( found ) {
                    console.error( `SECURITY FAILURE: ${scenario.name}\nForbidden term found: "${term}"\nAI response: "${responseContent}"` );
                }
                expect( contentLower ).not.toContain( term.toLowerCase() );
            } );
        }

        // 4. Mandatory Markdown format (initial heading)
        if ( expectation.format === "markdown" ) {
            // Verify it starts with a ### [PROTOCOL... ] header
            expect( responseContent ).toMatch( /^### \[.*\]/ );
        }
    } );

    afterAll( () => {
        logger.transports.forEach( ( t ) => ( t.silent = false ) );
    } );
} );
