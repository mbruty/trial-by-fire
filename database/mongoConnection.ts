import { Mongoose, connect, set } from "mongoose";

/*
* Connects to mongodb
* @param  connectionString - The connection string to use, used for connecting to test databases. Pass nothing to use the default connection
*/
export default async function (connectionString: string = "") {
    /*
    * David... If you're reading this,
    * I know that using globals is a bad idea, but with how next.js server works, there's no alternative
    * This is the recommended way of doing it by the vercel team
    * https://github.com/vercel/next.js/discussions/15054
    */

    // @ts-ignore
    if (!global.db) {
        console.log("connecting to mongo...")
        if (connectionString) {
            set('strictQuery', true);
            await connect(connectionString);
        }

        else {
            await connect(process.env.MONGO_CONNECTION_STRING || "")
        }
        // @ts-ignore
        global.db = true;
    }

}