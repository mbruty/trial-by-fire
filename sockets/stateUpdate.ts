import Game from 'database/models/game';
import getServerSocket from './getServerSocket';

async function startGame(message: string) {
    const io = getServerSocket();
    const data: { state: string; gameId: string } = JSON.parse(message);

    const updateObject: Record<string, unknown> = {
        state: data.state
    }

    if (data.state === 'bidding') {
        updateObject.bidStartedTimeStamp = Date.now();
        const game = await Game.findById(data.gameId);
        if (game) {
            game.players.forEach(x => x.currentBid = 0);
            await game.save();
        }
    }

    const game = await Game.findByIdAndUpdate(data.gameId, updateObject, { new: true });


    if (game) {
        io.to(game.code).emit('stateUpdate', data.state);
    }
}

export default startGame;