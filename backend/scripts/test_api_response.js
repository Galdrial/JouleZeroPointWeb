const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Card = require('../models/Card');

async function check() {
    await mongoose.connect(process.env.MONGODB_URI);
    const cards = await Card.find({}).sort({cardId:1}).limit(2);
    // Simulate Express res.json() which calls toJSON()
    console.log(JSON.stringify(cards, null, 2));
    process.exit(0);
}
check();
