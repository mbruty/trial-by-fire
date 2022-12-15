import mongoose from "mongoose";
import { Socket } from "socket.io";
import Game from "../database/models/game";
import getServerSocket from "./getServerSocket";

export default async function (message: string, socket: Socket) {
    const io = getServerSocket();
    const data: { code: string; gameId: string } = JSON.parse(message);

    await Game.findByIdAndUpdate(data.gameId, { state: 'playing' });

    io.to(data.code).emit('start', data.gameId);
}