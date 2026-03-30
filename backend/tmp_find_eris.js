const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const Card = require('./models/Card');

async function findEris() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const eris = await Card.findOne({ name: /Eris/i }, 'name effect');
        console.log(JSON.stringify(eris, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

findEris();
