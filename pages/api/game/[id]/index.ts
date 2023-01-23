import type { NextApiRequest, NextApiResponse } from 'next'
import Game from 'database/models/game';
import { isObjectIdOrHexString } from 'mongoose';

export async function getGame(gameId: string) {

    if (!isObjectIdOrHexString(gameId)) {
        throw 400;
    }

    const game = await Game.findById(gameId);

    if (!game) throw 404;

    game._id = game._id.toString();
    game.players.forEach(x => x._id = x._id.toString());

    return game;
}

async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method === 'GET') {
        try {
            const response = await getGame(req.query.id as string);
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