import type { NextApiRequest, NextApiResponse } from 'next'
import iceCalls from 'database/models/iceCalls';
import { isObjectIdOrHexString } from 'mongoose';
import getServerSocket from 'sockets/getServerSocket';
import Game from 'database/models/game';

export async function addCandidate(body: AddCandidateBody) {
    if (!isObjectIdOrHexString(body.gameId)) throw 400;

    const game = await Game.findById(body.gameId);
    if (!game) throw 400;

    try {
        if (body.isHost) {
            await iceCalls.findByIdAndUpdate(body.gameId, {
                $push: {
                    offerCandidates: {
                        candidate: body.candidate,
                        sdpMLineIndex: body.sdpMLineIndex,
                        sdpMid: body.sdpMid,
                        usernameFragment: body.usernameFragment
                    }
                }
            }, { upsert: true });
        } else {
            await iceCalls.findByIdAndUpdate(body.gameId, {
                $push: {
                    answerCandidates: {
                        candidate: body.candidate,
                        sdpMLineIndex: body.sdpMLineIndex,
                        sdpMid: body.sdpMid,
                        usernameFragment: body.usernameFragment
                    }
                }
            }, { upsert: true });
        }

        const io = getServerSocket();

        const event = body.isHost ? 'newOfferCandidate' : 'newAnswerCandidate';
        const type = body.isHost ? 'offer' : 'accept'
        io.to(game.code).emit(event, JSON.stringify({
            candidate: body.candidate,
            sdpMLineIndex: body.sdpMLineIndex,
            sdpMid: body.sdpMid,
            usernameFragment: body.usernameFragment,
            type
        }));
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
            await addCandidate(req.body);
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