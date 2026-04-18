import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

/**
 * Test Database Helpers — Joule Zero Point (TypeScript)
 *
 * Uses MongoMemoryServer: a fully in-memory MongoDB instance.
 * No credentials, no external connections — works locally and in CI.
 */

let mongod: MongoMemoryServer | null = null;

export const connectTestDB = async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);
};

export const closeTestDB = async () => {
    if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.dropDatabase();
        await mongoose.connection.close();
    }
    if (mongod) {
        await mongod.stop();
        mongod = null;
    }
};

export const clearDatabase = async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        await collections[key].deleteMany({});
    }
};
