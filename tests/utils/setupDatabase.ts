import mongoConnection from '../../database/mongoConnection';
import * as dbHandler from 'testcontainers-mongoose'
import mongoose from 'mongoose';

export async function connectMockDb(printConnectionString = false) {
    await dbHandler.connect();
    const connectionString = dbHandler.getMongodbConnectionString();
    if (printConnectionString) console.log(connectionString);
    mongoose.set('strictQuery', false);
    await mongoConnection(connectionString);
}

export async function clearMockDb() {
    await dbHandler.clearDatabase();
}

export async function disconnectMockDb() {
    await dbHandler.closeDatabase();
    // eslint-disable-next-line
    (global as any ).db = false;
}