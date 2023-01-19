import mongoConnection from '../../database/mongoConnection';
import { set } from 'mongoose';
import * as dbHandler from 'testcontainers-mongoose'

export async function connectMockDb() {
    await dbHandler.connect();
    const connectionString = dbHandler.getMongodbConnectionString();
    console.log(connectionString);
    set('strictQuery', true);
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