import mongoose from 'mongoose';
import type { NextApiRequest, NextApiResponse } from 'next'
import Game, { GameUser } from 'database/models/game';
import { setCookie } from 'cookies-next';



export async function createAnonymousUser(body?: JoinRoomBody): Promise<JoinRoomResponse> {
    if (!body) throw 400;
    
    const id = new mongoose.Types.ObjectId();
    const room = await Game.findOne({ 'code': body.gameCode });
    if (!room) throw 400;
    const gameUser: GameUser = {
        _id: id,
        name: body.name,
        beanBalance: room.startingBalance,
        isRemote: body.isRemote
    };

    room.players.push(gameUser);

    try {
        await room.save();

        return { ID: id.toString(), roomID: room._id.toString() }
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
            const response = await createAnonymousUser(req.body);
            setCookie('id', response.ID, { req, res });
            setCookie('room-id', response.roomID, { req, res });
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