import { Socket } from 'socket.io';
import Game from 'database/models/game';

async function joinRoom(message: string, socket: Socket) {
    const game = await Game.findOne({ code: message }, { 'players._id': 0, 'rounds._id': 0 }).lean();
    console.log('join');
    if (game) {
        socket.join(message);
        game._id = game?._id.toString();
        socket.emit('joined', JSON.stringify(game));
    }
}

export default joinRoom;