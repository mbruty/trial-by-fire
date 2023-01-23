import Game from 'database/models/game';
import getServerSocket from './getServerSocket';

async function startGame(message: string) {
    const io = getServerSocket();
    const data: { state: string; gameId: string } = JSON.parse(message);

    const updateObject: Record<string, unknown> = {
        state: data.state
    }

    const game = await Game.findByIdAndUpdate(data.gameId, updateObject, { new: true });
    if (data.state === 'bidding') {
        if (game) {
            game.bidStartedTimeStamp = Date.now();
            game.players.forEach(x => x.currentBid = 0);
            await game.save();
        }
    }


    if (game) {
        io.to(game.code).emit('stateUpdate', data.state);
    }
}

export default startGame;