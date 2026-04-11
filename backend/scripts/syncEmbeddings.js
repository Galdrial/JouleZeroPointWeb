const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const { getCachedCards } = require('../services/cardService');
const Card = require('../models/Card');
const { generateEmbedding } = require('../services/embeddingService');
const logger = require('../config/logger');
const connectDB = require('../config/db');

const syncEmbeddings = async () => {
    try {
        await connectDB();
        logger.info('SISTEMA_VIGILE: Inizio sincronizzazione vettoriale delle carte...');

        const sheetCards = await getCachedCards();
        let updatedCount = 0;

        for (const sCard of sheetCards) {
            let dbCard = await Card.findOne({ cardId: sCard.id });

            const cardText = `${sCard.name}. ${sCard.type}. ${sCard.role}. Effect: ${sCard.effect}`;
            
            if (!dbCard) {
                logger.info(`NEW_VECTOR: Generazione embedding per "${sCard.name}"...`);
                const embedding = await generateEmbedding(cardText);
                
                await Card.create({
                    cardId: sCard.id,
                    name: sCard.name,
                    type: sCard.type,
                    status: sCard.status,
                    cost_et: sCard.cost_et,
                    pep: sCard.pep,
                    rp: sCard.rp,
                    rarity: sCard.rarity,
                    effect: sCard.effect,
                    role: sCard.role,
                    image_url: sCard.image_url,
                    embedding
                });
                updatedCount++;
            } else if (!dbCard.embedding || dbCard.embedding.length === 0) {
                logger.info(`UPDATE_VECTOR: Aggiunta embedding mancante per "${sCard.name}"...`);
                const embedding = await generateEmbedding(cardText);
                dbCard.embedding = embedding;
                await dbCard.save();
                updatedCount++;
            }
        }

        logger.info(`SINCRONIZZAZIONE_COMPLETATA: ${updatedCount} carte aggiornate con successo.`);
        process.exit(0);
    } catch (error) {
        logger.error(`ERRORE_SYNC_VETTORIALE: ${error.message}`);
        process.exit(1);
    }
};

syncEmbeddings();
