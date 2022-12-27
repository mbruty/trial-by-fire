import { Server } from 'socket.io'
import mongoConnection from '../../../database/mongoConnection';
import bid from '../../../sockets/bid';
import joinRoom from '../../../sockets/joinRoom';
import startGame from '../../../sockets/startGame';
import stateUpdate from '../../../sockets/stateUpdate';
// I have to  disable typescript checks as it's not letting me declare a variable in the 'globalThis' type
// It also think that' res.socket.server isn't a thing when it is
// Then eslint is setup to stop me from doing ts-ignore

// Plug the socket io instance into the server instance
const ioHandler = async (req: NextApiRequest, res: NextApiResponse) => {
    // Typescript thinks that socket doesn't have a server attribute when it does
    // eslint-disable-next-line
    // @ts-ignore
    if (!global.io) {
        console.log('*First use, starting socket.io');
        // eslint-disable-next-line
        // @ts-ignore
        const io = new Server<ClientToServerEvents, ServerToClientEvents>(res.socket.server)
        setupSocketHandlers(io);
        // eslint-disable-next-line
        // @ts-ignore
        global.io = io;
        // eslint-disable-next-line
        // @ts-ignore
    } else if (!global.db) {
        await mongoConnection();
    } else {
        console.log('socket.io already running')
    }
    res.end()
}



function setupSocketHandlers(io: Server<ClientToServerEvents, ServerToClientEvents>) {
    io.on('connection', (socket) => {
        socket.on('join', (message: string) => joinRoom(message, socket));
        socket.on('start', startGame);
        socket.on('stateUpdate',stateUpdate);
        socket.on('bid', bid);
    });
}

export const config = {
    api: {
        bodyParser: false
    }
}

export default ioHandler
