import type { NextApiRequest, NextApiResponse } from 'next'
import { Storage } from '@google-cloud/storage';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import Game from 'database/models/game';
import mongoose from 'mongoose';
import getPlayerImage from 'database/utilities/getPlayerImage';
import getServerSocket from 'sockets/getServerSocket';

const gc = new Storage({
    keyFilename: path.join(__dirname, '../../../../../gcp-storage-key.json'),
    projectId: 'finalyearproject-363115 ',
});

const imgBucket = gc.bucket('trial-by-fire');

export async function postImage(body: ImageUploadBody) {
    // Delete the old image if there is one
    const imageURL = await getPlayerImage(body.gameCode, body.userId);
    if (imageURL) {
        imgBucket.file(imageURL).delete();
    }

    const imageBuf = Buffer.from(body.imageBase64.replace(/^data:image\/jpeg;base64,/, ''), 'base64');
    const fileName = `${uuidv4()}.jpg`;
    await new Promise((resolve, reject) => {
        imgBucket.file(fileName)
            .save(imageBuf, (err) => {
                if (err) {
                    console.log(err);
                    return reject();
                }
                return resolve('');
            });
    })

    const updated = await Game.findOneAndUpdate(
        {
            code: body.gameCode,
            'players._id': new mongoose.Types.ObjectId(body.userId)
        },
        { $set: { 'players.$.imageURL': fileName } },
        { new: true }
    );

    if (!updated) return;
    const io = getServerSocket();

    io.to(updated.code).emit('userUpdate', JSON.stringify(updated.players));
}

async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method == 'POST') {
        await postImage(req.body).catch(e => { console.log(e); res.status(400) });
        res.status(200);
        return res.end();
    }
    res.status(405);
    res.end()
}

export default handler;
