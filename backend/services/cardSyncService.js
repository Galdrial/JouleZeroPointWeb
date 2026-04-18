const axios = require('axios');
const Card = require('../models/Card');
const logger = require('../config/logger');

/**
 * Card Synchronization Service (Joule Sync Engine).
 * Orchestrates the industrial-grade synchronization between Google Sheets and MongoDB Atlas.
 * Implements non-destructive intelligence (Upsert) to maintain data continuity.
 */
const SHEETS_URL = process.env.SHEETS_URL || 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ4otsaVBcLkcGI4zdD8aBJn0nRah9mUrEG0BprARIMF0WdocEkPsBkK0n4v-Sdf70KnBGmI95nS7EG/pub?gid=1051449153&single=true&output=tsv';

/**
 * Parses TSV content into structured card entities.
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

        const card = {
            cardId: id,
            name: data['Nome'],
            type: data['Tipo'],
            status: data['Stato'],
            cost_et: parseInt(data['Costo_ET'], 10) || 0,
            pep: parseInt(data['PEP'], 10) || 0,
            rp: parseInt(data['RP'], 10) || 0,
            rarity: data['Rarità'],
            effect: data['Effetto'],
            role: data['Ruolo'],
        };

        // IMAGE LOGIC: Remote priority, fallback to local assets
        if (data['URL_Immagine']) {
            card.image_url = data['URL_Immagine'];
        } else {
            // Refined Sanity: Remove apostrophes and commas to match disk filenames
            const sanitizedName = (data['Nome'] || '')
                .replace(/'/g, '')
                .replace(/,/g, '')
                .replace(/ /g, '_');
            card.image_url = `/assets/cards/${String(id).padStart(3, '0')}_${sanitizedName}.png`;
        }

        if (card.name) {
            cards.push(card);
        }
    }
    return cards;
};

/**
 * Synchronizes the database with the external Sheets source.
 * Uses a non-destructive bulkWrite operation to maximize throughput and preserve data integrity.
 */
const syncCards = async () => {
    try {
        logger.info('SYNC_ENGINE: Initiating synchronization with Data Matrix...');
        const response = await axios.get(SHEETS_URL);
        const externalCards = parseCSV(response.data);

        if (externalCards.length === 0) {
            logger.warn('SYNC_ENGINE: No cards found in the provided matrix source.');
            return { updated: 0, total: 0 };
        }

        // Operation Batching: Build a list of upsert operations
        const operations = externalCards.map(card => ({
            updateOne: {
                filter: { cardId: card.cardId },
                update: { $set: card },
                upsert: true
            }
        }));

        const result = await Card.bulkWrite(operations);
        
        const summary = {
            updated: result.nUpserted + result.nModified,
            total: externalCards.length
        };

        logger.info(`SYNC_ENGINE: Synchronization successful. Updated/Inserted: ${summary.updated}/${summary.total} nodes.`);
        return summary;

    } catch (error) {
        logger.error(`SYNC_ENGINE_FAILURE: Error during synchronization protocol: ${error.message}`);
        throw error;
    }
};

module.exports = {
    syncCards
};
