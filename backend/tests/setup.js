const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Use a separate test database
const TEST_MONGODB_URI = process.env.MONGODB_URI + '_test';

const connectTestDB = async () => {
    if (mongoose.connection.readyState === 0) {
        await mongoose.connect(TEST_MONGODB_URI);
    }
};

const closeTestDB = async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
};

const clearDatabase = async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        const collection = collections[key];
        await collection.deleteMany();
    }
};

module.exports = {
    connectTestDB,
    closeTestDB,
    clearDatabase
};
