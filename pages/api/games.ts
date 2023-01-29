import type { NextApiRequest, NextApiResponse } from 'next'
import Game from 'database/models/game';
import connectDb from 'database/mongoConnection';
export async function getGames() {


    const games = await Game.find({});

    if (!games) throw 404;

    games.forEach(game => {
        game._id = game._id.toString();
        game.players.forEach(x => x._id = x._id.toString());
    });

    return games;
}

async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    await connectDb();
    if (req.method === 'GET') {
        try {
            const response = await getGames();
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