const mongoose = require('mongoose');
const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Card = require('../models/Card');
const logger = require('../config/logger');

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
            image_url: `/assets/cards/${String(id).padStart(3, '0')}_${(data['Nome'] || '').replace(/,/g, '').replace(/ /g, '_')}.png`
        };

        if (card.name) {
            cards.push(card);
        }
    }
    return cards;
};

const seed = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cyber_point');
        console.log('CONNESSO AL DATABASE PER SEEDING.');

        const response = await axios.get(SHEETS_URL);
        const cardsData = parseCSV(response.data);

        console.log(`TROVATE ${cardsData.length} CARTE NEL CLOUD. INIZIO INIEZIONE...`);

        // Svuota e reinserisce
        await Card.deleteMany({});
        await Card.insertMany(cardsData);

        console.log('INIEZIONE COMPLETATA CON SUCCESSO. CARTE SINCRONIZZATE.');
        process.exit(0);
    } catch (error) {
        console.error('ERRORE SEEDING:', error);
        process.exit(1);
    }
};

seed();
