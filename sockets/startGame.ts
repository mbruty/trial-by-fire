import Game from 'database/models/game';
import { isObjectIdOrHexString } from 'mongoose';
import getServerSocket from './getServerSocket';

async function startGame(message: string) {
    const io = getServerSocket();
    const data: { code: string; gameId: string } = JSON.parse(message);

    if (!isObjectIdOrHexString(data.gameId)) return;
    const result = await Game.findByIdAndUpdate(data.gameId, { state: 'playing' });
    if (!result) return;
    io.to(data.code).emit('start', data.gameId);
}

export default startGame;