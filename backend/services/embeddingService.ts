import { OpenAI } from 'openai';
import logger from '../config/logger';

// Initialize the OpenAI interface with the environment-provided API key.
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Generates a high-dimensional vector embedding for the provided text.
 * Utilizes the 'text-embedding-3-small' model for optimal balance between performance and cost.
 * 
 * @async
 * @param {string} text - The input text to transform into a vector.
 * @returns {Promise<number[]>} - The generated embedding vector (1536 dimensions by default).
 * @protocol Sanitizes input by removing newlines to ensure consistent embedding generation.
 */
export const generateEmbedding = async (text: string): Promise<number[]> => {
    try {
        if (!text || typeof text !== 'string') return [];
        
        const response = await openai.embeddings.create({
            model: "text-embedding-3-small",
            input: text.replace(/\n/g, " "),
            encoding_format: "float",
        });

        return response.data[0].embedding;
    } catch (error) {
        logger.error(`EMBEDDING_GEN_ERROR: ${(error as Error).message}`);
        return [];
    }
};

/**
 * Calculates the cosine similarity between two numerical vectors.
 * Essential for ranking card similarity during AI-driven discovery.
 * 
 * @param {number[]} vecA - First input vector.
 * @param {number[]} vecB - Second input vector to compare against.
 * @returns {number} - Similarity score ranging from -1 to 1 (usually 0 to 1 in this context).
 */
export const cosineSimilarity = (vecA: number[], vecB: number[]): number => {
    const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
    const magA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const magB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
    if (!magA || !magB) return 0;
    return dotProduct / (magA * magB);
};
