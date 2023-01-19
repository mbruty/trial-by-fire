import { Socket } from 'socket.io';
import Game from 'database/models/game';

async function joinRoom(message: string, socket: Socket) {
    socket.join(message);
    const game = await Game.findOne({ code: message }, { 'players._id': 0, 'rounds._id': 0 }).lean();
    if (game) {
        game._id = game?._id.toString();
        socket.emit('joined', JSON.stringify(game));
    }
}

export default joinRoom;