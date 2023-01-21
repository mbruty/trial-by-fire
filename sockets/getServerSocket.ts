import { Server } from 'socket.io';
import { DefaultEventsMap } from 'socket.io/dist/typed-events';

function getServerSocket(): Server<ClientToServerEvents, ServerToClientEvents, DefaultEventsMap, unknown> {
    // eslint-disable-next-line
    // @ts-ignore
    return global.io;
}

export default getServerSocket;