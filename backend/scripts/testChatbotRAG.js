const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Card = require('../models/Card');
const Message = require('../models/Message');
const { generateEmbedding, cosineSimilarity } = require('../services/embeddingService');
const connectDB = require('../config/db');

const testRAG = async () => {
    try {
        await connectDB();
        
        const testQuery = "Quali carte di tipo Gas infliggono più danni?";
        console.log(`[TEST_RAG] Domanda: "${testQuery}"`);

        // 1. Test Embedding Generation
        const queryVector = await generateEmbedding(testQuery);
        console.log(`[TEST_RAG] Vettore generato (dimensioni: ${queryVector.length})`);

        if (queryVector.length === 0) throw new Error("Generazione embedding fallita");

        // 2. Test Vector Search
        const cards = await Card.find({ embedding: { $exists: true, $ne: [] } });
        const scoredCards = cards.map(c => ({
            name: c.name,
            score: cosineSimilarity(queryVector, c.embedding)
        })).sort((a, b) => b.score - a.score);

        const top = scoredCards.slice(0, 3);
        console.log('[TEST_RAG] Risultati Similitudine (Top 3):');
        top.forEach((c, i) => console.log(`${i+1}. ${c.name} (Score: ${(c.score*100).toFixed(2)}%)`));

        if (top.length === 0) throw new Error("Nessun risultato vettoriale");

        console.log('[TEST_RAG] ✅ Ricerca Vettoriale FUNZIONANTE.');
        process.exit(0);
    } catch (error) {
        console.error(`[TEST_RAG] ❌ ERRORE: ${error.message}`);
        process.exit(1);
    }
};

testRAG();
