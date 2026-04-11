/**
 * AI Integrity & Simulation Suite — Joule Zero Point.
 * 
 * Questa suite esegue i "Golden Cases" definiti in JSON per verificare la 
 * stabilità del comportamento dell'IA, l'aderenza al ruolo e la 
 * sicurezza contro le iniezioni.
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { streamChat, buildPromptMessages } = require('../services/aiService');
const logger = require('../config/logger');

// Disabilitiamo i log di debug per pulir l'output dei test
logger.transports.forEach((t) => (t.silent = true));

const goldenCasesPath = path.join(__dirname, 'ai-simulations', 'golden_cases.json');
const goldenCases = JSON.parse(fs.readFileSync(goldenCasesPath, 'utf8'));

describe('AI Simulation: Joule Referee Integrity', () => {
    // Timeout esteso per le chiamate reali all'IA
    jest.setTimeout(45000);

    test.each(goldenCases)('Simulation Case: $name ($category)', async (scenario) => {
        const { input, expectation } = scenario;

        // Costruzione del contesto
        const promptMessages = buildPromptMessages({
            userMessage: input,
            userRecord: null, 
            userIdentity: "Ospite Esterno",
            historyMessages: [],
            totalCards: 42,
            gameState: null
        });

        // Esecuzione della simulazione live
        const responseContent = await streamChat(
            promptMessages,
            (delta) => { /* streaming silenziato */ },
            () => { /* done */ },
            (errorMsg) => { throw new Error(`AI_SERVICE_ERROR: ${errorMsg}`); }
        );

        if (responseContent === null) {
            throw new Error("Simulazione interrotta: il servizio AI non ha restituito contenuto.");
        }

        // --- VALIDAZIONI PROFESSIONALI (REGEX BASED) ---
        
        const contentLower = responseContent.toLowerCase();

        // 1. Risposta non nulla e strutturata
        expect(responseContent.length).toBeGreaterThan(20);

        // 2. Presenza parole chiave / intenti obbligatori
        if (expectation.contains) {
            expectation.contains.forEach(term => {
                // Se il termine inizia con "/", lo trattiamo come Regex
                const isRegex = term.startsWith('/') && term.endsWith('/');
                if (isRegex) {
                    const regex = new RegExp(term.slice(1, -1), 'i');
                    const match = regex.test(responseContent);
                    if (!match) {
                        console.error(`FALLIMENTO REGEX: ${scenario.name}\nPattern mancante: ${term}\nRisposta IA: "${responseContent}"`);
                    }
                    expect(responseContent).toMatch(regex);
                } else {
                    const found = contentLower.includes(term.toLowerCase());
                    if (!found) {
                        console.error(`FALLIMENTO TERMINE: ${scenario.name}\nTermine mancante: "${term}"\nRisposta IA: "${responseContent}"`);
                    }
                    expect(contentLower).toContain(term.toLowerCase());
                }
            });
        }

        // 3. Assenza parole vietate
        if (expectation.must_not_contain) {
            expectation.must_not_contain.forEach(term => {
                const found = contentLower.includes(term.toLowerCase());
                if (found) {
                    console.error(`FALLIMENTO SICUREZZA: ${scenario.name}\nTermine vietato presente: "${term}"\nRisposta IA: "${responseContent}"`);
                }
                expect(contentLower).not.toContain(term.toLowerCase());
            });
        }

        // 4. Formato Markdown obbligatorio (Intestazione iniziale)
        if (expectation.format === "markdown") {
            // Verifichiamo che inizi con un header ### [PROTOCOLLO...]
            expect(responseContent).toMatch(/^### \[.*\]/);
        }
    });

    afterAll(() => {
        logger.transports.forEach((t) => (t.silent = false));
    });
});
