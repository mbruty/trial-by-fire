import { Mongoose, connect, set } from "mongoose";

/*
* Connects to mongodb
* @param  connectionString - The connection string to use, used for connecting to test databases. Pass nothing to use the default connection
*/
export default async function(connectionString: string = ""): Promise<Mongoose> {
    console.log("connecting to mongo...")
    if (connectionString) {
        set('strictQuery', true);
        await connect(connectionString);
    }

    return connect(process.env.MONGO_CONNECTION_STRING || "");
}