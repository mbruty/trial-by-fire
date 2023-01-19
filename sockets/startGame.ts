import Game from 'database/models/game';
import getServerSocket from './getServerSocket';

async function startGame(message: string) {
    const io = getServerSocket();
    const data: { code: string; gameId: string } = JSON.parse(message);

    await Game.findByIdAndUpdate(data.gameId, { state: 'playing' });

    io.to(data.code).emit('start', data.gameId);
}

export default startGame;