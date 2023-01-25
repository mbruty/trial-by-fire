import type { NextApiRequest, NextApiResponse } from 'next'
import Game from 'database/models/game';
import { isObjectIdOrHexString } from 'mongoose';

export async function win(gameId: string, playerId: string) {
    if (!isObjectIdOrHexString(gameId) || !isObjectIdOrHexString(playerId)) {
        throw 400;
    }

    const game = await Game.findById(gameId);

    if (!game) throw 404;

    const players = game.players
        .filter(x => x.currentBid !== undefined && x.currentBid !== 0)
        .sort((a, b) => (b.currentBid ?? 0) - (a.currentBid ?? 0))
        .slice(0, 2);

    if (players.length !== 2) throw 500;
    const winner = players.find(x => x._id.toString() === playerId);
    const loser = players.find(x => x._id.toString() !== playerId);

    if (!winner || !loser || !loser.currentBid) throw 500;

    winner.beanBalance += loser.currentBid;
    loser.beanBalance -= loser.currentBid;

    game.currentRound += 1;
    await game.save();
}

async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method === 'POST') {
        try {
            await win(req.body.gameId, req.body.playerId);
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