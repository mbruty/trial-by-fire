import { Server } from "socket.io";
import { DefaultEventsMap } from "socket.io/dist/typed-events";

export default function(): Server<ClientToServerEvents, ServerToClientEvents, DefaultEventsMap, any> {
    // @ts-ignore
    return global.io;
}