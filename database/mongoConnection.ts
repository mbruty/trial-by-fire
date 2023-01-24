import mongoose from 'mongoose';
import * as dbHandler from 'testcontainers-mongoose'

/*
* Connects to mongodb
* @param  connectionString - The connection string to use, used for connecting to test databases. Pass nothing to use the default connection
*/
async function connectDb(connectionString = '') {
    /*
    * David... If you're reading this,
    * I know that using globals is a bad idea, but with how next.js server works, there's no alternative
    * This is the recommended way of doing it by the vercel team
    * https://github.com/vercel/next.js/discussions/15054
    */

    // eslint-disable-next-line
    // @ts-ignore
    if (!global.db) {
        // Use the test db

        if (process.env.USE_TEST_DB === 'true') {
            console.log('using test db');
            await dbHandler.connect();
            const connectionString = dbHandler.getMongodbConnectionString();
            mongoose.set('strictQuery', false);
            await mongoose.connect(connectionString);
            console.log({connectionString});
        }

        else if (connectionString) {
            mongoose.set('strictQuery', true);
            await mongoose.connect(connectionString);
        }

        else {
            mongoose.set('strictQuery', true);
            await mongoose.connect(process.env.MONGO_CONNECTION_STRING || '')
        }
        // eslint-disable-next-line
        // @ts-ignore
        global.db = true;
    }

}

export default connectDb;