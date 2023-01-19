import type { NextApiRequest, NextApiResponse } from 'next'
import Game from 'database/models/game';

export async function createGame(gameId: string) {
    const game = await Game.findById(gameId);

    if (!game) throw 404;

    const players = game.players
        .filter(x => x.currentBid !== undefined)
        .sort((a, b) => (b.currentBid ?? 0) - (a.currentBid ?? 0));

    return players;
}

async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method === 'GET') {
        try {
            const response = await createGame(req.query.id as string);
            res.json(response);
            res.status(200);
        } catch (e: unknown) {
            res.status(e as number);
        } finally {
            res.end();
        }
    }
}

export default handler;