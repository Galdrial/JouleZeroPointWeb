const mongoose = require('mongoose');
require('dotenv').config();
const Card = require('../models/Card');

async function check() {
    await mongoose.connect(process.env.MONGODB_URI);
    const cards = await Card.find({}).limit(10);
    console.log(JSON.stringify(cards.map(c => ({ id: c.cardId, name: c.name, url: c.image_url })), null, 2));
    process.exit(0);
}
check();
