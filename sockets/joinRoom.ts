import { Socket } from "socket.io";
import Game from "../database/models/game";

export default async function (message: string, socket: Socket) {
    socket.join(message);
    const game = await Game.findOne({ code: message }, { _id: 0, 'players._id': 0, 'rounds._id': 0 }).lean();

    if (game) {
        socket.emit('state', JSON.stringify(game));
    }
}