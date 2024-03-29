import type { NextApiRequest, NextApiResponse } from 'next'
import Game from 'database/models/game';
import connectDb from 'database/mongoConnection';

function createCode(): string {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    return code.slice(0, 2) + '-' + code.slice(2, 4) + '-' + code.slice(4, 6);
}

export async function createGame(body: CreateGameBody): Promise<CreateGameResponse> {
    if (!body.trials || body.trials.length === 0 || !body.starterBeanCount) {
        throw 400;
    }

    // Create a unique 6-digit code
    let code;
    do {
        code = createCode();
    } while (await Game.countDocuments({ code }) !== 0);

    try {
        const created = await Game.create({
            code,
            startingBalance: body.starterBeanCount,
            rounds: body.trials
        })
    
        return {
            code,
            gameId: created._id.toString()
        }
    } catch {
        throw 400;
    }
}

async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method == 'POST') {
        try {
            await connectDb();
            const response = await createGame(req.body);
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