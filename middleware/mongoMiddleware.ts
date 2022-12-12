import { Mongoose } from 'mongoose';
import nextConnect, { NextHandler } from 'next-connect';
import connect from '../database/mongoConnection';

const client: Mongoose | null = null;

async function database(req: Request, res: Response, next: NextHandler) {
  if (!client) await connect();
  return next();
}

const middleware = nextConnect();

middleware.use(database);

export default middleware;