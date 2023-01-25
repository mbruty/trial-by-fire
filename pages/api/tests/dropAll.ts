import type { NextApiRequest, NextApiResponse } from 'next'
import Game from 'database/models/game';
import connectDb from 'database/mongoConnection';
async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method === 'GET') {
        try {
            if (process.env.USE_TEST_DB === 'true') {

                await connectDb();
                // Only run this when we're running the test db
                // This endpoint is only for cypress
                await connectDb();
                await Game.deleteMany({});
                res.status(200);
            } else {
                throw 404
            }

        } catch (e: unknown) {
            res.status(e as number);
        } finally {
            res.end();
        }
    } else {
        res.status(405);
        res.end();
    }
}

export default handler;