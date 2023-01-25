import type { NextApiRequest, NextApiResponse } from 'next'
import { isObjectIdOrHexString } from 'mongoose';
import iceCalls from 'database/models/iceCalls';

export async function getCalls(gameId: string) {

    if (!isObjectIdOrHexString(gameId)) {
        throw 400;
    }

    const call = await iceCalls.findById(gameId);

    if (!call) throw 404;

    return call;
}

async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method === 'GET') {
        try {
            const response = await getCalls(req.query.id as string);
            res.json(response);
            res.status(200);
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