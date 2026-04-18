const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Card = require('../models/Card');

async function check() {
    try {
        console.log('Connecting to:', process.env.MONGODB_URI ? 'URI Found' : 'URI MISSING');
        await mongoose.connect(process.env.MONGODB_URI);
        const cards = await Card.find({ name: /'/ }).limit(5);
        console.log('--- Cards with apostrophes in name ---');
        console.log(JSON.stringify(cards.map(c => ({ 
            id_virtual: c.id, 
            cardId: c.cardId, 
            name: c.name, 
            url: c.image_url 
        })), null, 2));
        
        const firstCards = await Card.find({}).sort({cardId: 1}).limit(5);
        console.log('--- First 5 cards (General) ---');
        console.log(JSON.stringify(firstCards.map(c => ({ 
            id_virtual: c.id, 
            cardId: c.cardId, 
            name: c.name, 
            url: c.image_url 
        })), null, 2));

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
check();
