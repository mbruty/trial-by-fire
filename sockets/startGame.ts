import mongoose from "mongoose";
import { Socket } from "socket.io";
import Game from "../database/models/game";
import getServerSocket from "./getServerSocket";

export default function(message: string, socket: Socket) {
    const io = getServerSocket();
    const data: { code: string; gameId: string } = JSON.parse(message);
    
    Game.updateOne({ '_id': new mongoose.Types.ObjectId(data.gameId) }, { $set: { state: 'playing' } });

    io.to(data.code).emit('start', data.gameId);
}