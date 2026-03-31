const axios = require('axios');
const NodeCache = require('node-cache');
const logger = require('../config/logger');

// Cache strategy: TTL set to 600 seconds (10 minutes) to balance freshness and performance.
const cardsCache = new NodeCache({ stdTTL: 600 });
const CACHE_KEY = 'all_cards';

// External Data Matrix: Google Sheets TSV output for card definitions.
const SHEETS_URL = process.env.SHEETS_URL || 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ4otsaVBcLkcGI4zdD8aBJn0nRah9mUrEG0BprARIMF0WdocEkPsBkK0n4v-Sdf70KnBGmI95nS7EG/pub?gid=1051449153&single=true&output=tsv';

/**
 * Parses TSV content from the central data matrix into a structured card array.
 * 
 * @param {string} fileContent - Raw TSV data from the source.
 * @returns {Array<Object>} - Collection of formatted card entities.
 */
const parseCSV = (fileContent) => {
    const lines = fileContent.split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split('\t').map(h => h.trim());
    const cards = [];

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;

        const values = line.split('\t').map(v => v.trim());
        const data = {};
        headers.forEach((header, index) => {
            data[header] = values[index];
        });

        const id = parseInt(data['ID'], 10);
        if (isNaN(id)) continue;

        // Model transformation for frontend and logic consistency
        const card = {
            id,
            name: data['Nome'],
            type: data['Tipo'],
            status: data['Stato'],
            cost_et: parseInt(data['Costo_ET'], 10) || 0,
            pep: parseInt(data['PEP'], 10) || 0,
            rp: parseInt(data['RP'], 10) || 0,
            rarity: data['Rarità'],
            effect: data['Effetto'],
            role: data['Ruolo'],
            image_url: `/assets/cards/${String(id).padStart(3, '0')}_${(data['Nome'] || '').replace(/,/g, '').replace(/ /g, '_')}.png`
        };

        if (card.name) {
            cards.push(card);
        }
    }
    return cards;
};

/**
 * High-performance card retrieval.
 * Prioritizes the Quantum Cache (NodeCache) before falling back to the Cloud Matrix (Google Sheets).
 * 
 * @async
 * @returns {Promise<Array<Object>>} - The synchronized collection of cards.
 * @throws {Error} - If the cloud synchronization protocol fails.
 */
const getCachedCards = async () => {
    const cachedData = cardsCache.get(CACHE_KEY);
    if (cachedData) {
        logger.debug('VIGIL_SYSTEM: Retrieving cards from Quantum Cache.');
        return cachedData;
    }

    try {
        logger.info('VIGIL_SYSTEM: Synchronizing with Data Matrix (Google Sheets).');
        const response = await axios.get(SHEETS_URL);
        const cards = parseCSV(response.data);
        
        cardsCache.set(CACHE_KEY, cards);
        return cards;
    } catch (error) {
        logger.error(`CARD_SYNC_ERROR: ${error.message}`);
        throw new Error('Unable to synchronize cards from the cloud matrix.');
    }
};

module.exports = {
    getCachedCards,
    clearCache: () => cardsCache.del(CACHE_KEY)
};
