const mongoose = require( 'mongoose' );
const { MongoMemoryServer } = require( 'mongodb-memory-server' );

/**
 * Test Database Helpers — Joule Zero Point
 *
 * Uses MongoMemoryServer: a fully in-memory MongoDB instance.
 * No credentials, no external connections — works locally and in CI.
 */

let mongod = null;

const connectTestDB = async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect( uri );
};

const closeTestDB = async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    if ( mongod ) {
        await mongod.stop();
        mongod = null;
    }
};

const clearDatabase = async () => {
    const collections = mongoose.connection.collections;
    for ( const key in collections ) {
        await collections[key].deleteMany();
    }
};

module.exports = { connectTestDB, closeTestDB, clearDatabase };
