import type { NextApiRequest, NextApiResponse } from 'next'
import iceCalls from 'database/models/iceCalls';
import { isObjectIdOrHexString } from 'mongoose';
import getServerSocket from 'sockets/getServerSocket';
import Game from 'database/models/game';

export async function createGame(body: CreateCallBody) {
    if (!isObjectIdOrHexString(body.gameId)) throw 400;
    const game = await Game.findById(body.gameId);

    if (!game) throw 404;

    try {
        if (body.isHost) {
            await iceCalls.findOneAndUpdate({ _id: body.gameId }, {
                offer: {
                    sdp: body.sdp,
                    type: body.type
                }
            }, { upsert: true });
        } else {
            await iceCalls.findOneAndUpdate({ _id: body.gameId }, {
                answer: {
                    sdp: body.sdp,
                    type: body.type
                }
            }, { upsert: true });

            const io = getServerSocket();
            io.to(game.code).emit('answer', JSON.stringify({
                playerId: body.playerId,
                sdp: body.sdp,
                type: body.type
            }))
        }

    }
    catch (e) {
        throw 400;
    }
}

async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method == 'POST') {
        try {
            await createGame(req.body);
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