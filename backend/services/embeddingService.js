const { OpenAI } = require('openai');
const logger = require('../config/logger');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Generates an embedding for the given text.
 * @param {string} text - The input text to embed.
 * @returns {Promise<number[]>} - The generated embedding vector.
 */
const generateEmbedding = async (text) => {
    try {
        if (!text || typeof text !== 'string') return [];
        
        const response = await openai.embeddings.create({
            model: "text-embedding-3-small",
            input: text.replace(/\n/g, " "),
            encoding_format: "float",
        });

        return response.data[0].embedding;
    } catch (error) {
        logger.error(`ERRORE_EMBEDDING_GEN: ${error.message}`);
        return [];
    }
};

/**
 * Calculates cosine similarity between two vectors.
 */
const cosineSimilarity = (vecA, vecB) => {
    const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
    const magA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const magB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
    if (!magA || !magB) return 0;
    return dotProduct / (magA * magB);
};

module.exports = {
    generateEmbedding,
    cosineSimilarity
};
