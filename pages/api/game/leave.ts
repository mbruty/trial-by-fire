import { Storage } from '@google-cloud/storage';
import { deleteCookie } from 'cookies-next';
import type { NextApiRequest, NextApiResponse } from 'next'
import path from 'path';
import Game from 'database/models/game';
import getPlayerImage from 'database/utilities/getPlayerImage';
import getServerSocket from 'sockets/getServerSocket';

const gc = new Storage({
    keyFilename: path.join(__dirname, '../../../../../gcp-storage-key.json'),
    projectId: 'finalyearproject-363115 ',
});

const imgBucket = gc.bucket('trial-by-fire');

export async function leaveRoom(body?: LeaveRoomBody) {
    if (!body || !body.gameCode || !body.id ) throw 400;
    // Get the players image url and delete
    const imageURL = await getPlayerImage(body.gameCode, body.id);
    if (imageURL) {
        imgBucket.file(imageURL).delete();
    }

    const updated = await Game.findOneAndUpdate({ code: body.gameCode }, { $pull: { players: { _id: body.id } } }, { new: true });

    if (!updated) throw 404;

    const io = getServerSocket();

    io.to(updated.code).emit('userUpdate', JSON.stringify(updated.players));
}

async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method == 'POST') {
        try {
            await leaveRoom(req.body);
            deleteCookie('id', { req, res });
            deleteCookie('room-id', { req, res });
            res.status(200);
        } catch (e: unknown) {
            if (Number.isFinite(e)) res.status(e as number);
            else res.status(400);
        } finally {
            res.end();
        }
    } else {
        res.status(405);
        res.end();
    }
}

export default handler;
