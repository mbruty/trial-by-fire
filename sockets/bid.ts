import Game from 'database/models/game';
import { isObjectIdOrHexString } from 'mongoose';
import getServerSocket from 'sockets/getServerSocket';

async function bid(message: string) {
    // Get the date before doing any API calls to ensure that it is accurately recorded
    const now = Date.now();
    const io = getServerSocket();
    const data: { ammount: number, userId: string, gameId: string } = JSON.parse(message);

    if (!isObjectIdOrHexString(data.gameId)) return;
    const game = await Game.findById(data.gameId);

    if (!game) return;

    // Calculate when bidding ends. Start TimeStamp (ms) + bidding seconds converted to ms
    const endTimeStamp = game.bidStartedTimeStamp + (game.biddingSeconds * 1000);
    // If the end timestamp
    if (endTimeStamp < now) return;

    const player = game.players.find(x => x._id.toString() === data.userId);
    if (!player) return;

    if (player.currentBid !== undefined && player.currentBid >= data.ammount) return;
    if (player.beanBalance < data.ammount) return;
    
    player.currentBid = data.ammount;
    await game.save()
    io.to(game.code).emit('newBid', data.ammount.toString());
}

export default bid;
