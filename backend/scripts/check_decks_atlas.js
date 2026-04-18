const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Deck = require('../models/Deck');

async function check() {
    await mongoose.connect(process.env.MONGODB_URI);
    const decks = await Deck.find({}).limit(5);
    console.log(JSON.stringify(decks.map(d => ({ 
        id: d._id, 
        name: d.name, 
        costruttoreId: d.costruttoreId,
        cards: d.cards 
    })), null, 2));
    process.exit(0);
}
check();
