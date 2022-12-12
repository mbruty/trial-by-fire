import { Storage } from '@google-cloud/storage';
import mongoose from 'mongoose';
import type { NextApiRequest, NextApiResponse } from 'next'
import path from 'path';
import Game, { IGame } from '../../../database/models/game';
import getPlayerImage from '../../../database/utilities/getPlayerImage';

const gc = new Storage({
    keyFilename: path.join(__dirname, '../../../../../gcp-storage-key.json'),
    projectId: "finalyearproject-363115 ",
});

const imgBucket = gc.bucket('trial-by-fire');

export async function createAnonymousUser(body: LeaveRoomBody) {
    // Get the players image url and delete
    const imageURL = await getPlayerImage(body.gameCode, body.id);
    if (imageURL) {
        imgBucket.file(imageURL).delete();
    }

    await Game.updateOne({ code: body.gameCode }, { $pull: { players: { _id: body.id } } })
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method == 'POST') {
        try {
            const response = await createAnonymousUser(req.body);
            res.status(200);
        } catch (e: any) {
            res.status(400);
        } finally {
            res.end();
        }
    }
}