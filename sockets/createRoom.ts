import { Socket } from 'socket.io';
import game from '../database/models/game';

function createCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

export default async function(message: string, socket: Socket) {
    let code;
    do {
        code = createCode();
    } while (await game.countDocuments({ code }) !== 0);
}