const axios = require('axios');
const NodeCache = require('node-cache');
const logger = require('../config/logger');

// Cache cards for 10 minutes (600 seconds)
const cardsCache = new NodeCache({ stdTTL: 600 });
const CACHE_KEY = 'all_cards';

const SHEETS_URL = process.env.SHEETS_URL || 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ4otsaVBcLkcGI4zdD8aBJn0nRah9mUrEG0BprARIMF0WdocEkPsBkK0n4v-Sdf70KnBGmI95nS7EG/pub?gid=1051449153&single=true&output=tsv';

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

const getCachedCards = async () => {
    const cachedData = cardsCache.get(CACHE_KEY);
    if (cachedData) {
        logger.debug('SISTEMA_VIGILE: Recupero carte dalla Cache Quantica.');
        return cachedData;
    }

    try {
        logger.info('SISTEMA_VIGILE: Sincronizzazione con la Matrice (Google Sheets).');
        const response = await axios.get(SHEETS_URL);
        const cards = parseCSV(response.data);
        
        cardsCache.set(CACHE_KEY, cards);
        return cards;
    } catch (error) {
        logger.error(`ERRORE_SYNC_CARTE: ${error.message}`);
        throw new Error('Impossibile sincronizzare le carte dal cloud.');
    }
};

module.exports = {
    getCachedCards,
    clearCache: () => cardsCache.del(CACHE_KEY)
};
