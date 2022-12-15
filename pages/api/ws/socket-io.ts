import { Server } from 'socket.io'
import mongoConnection from '../../../database/mongoConnection';
import joinRoom from '../../../sockets/joinRoom';
import startGame from '../../../sockets/startGame';

// Plug the socket io instance into the server instance
const ioHandler = async (req: NextApiRequest, res: NextApiResponse) => {
    // Typescript thinks that socket doesn't have a server attribute when it does
    // @ts-ignore
    if (!global.io) {
        console.log('*First use, starting socket.io')
        // @ts-ignore
        const io = new Server<ClientToServerEvents, ServerToClientEvents>(res.socket.server)
        setupSocketHandlers(io);
        // @ts-ignore
        global.io = io;
        // @ts-ignore
    } else if (!global.db) {
        await mongoConnection();
    } else {
        console.log('socket.io already running')
    }
    res.end()
}



function setupSocketHandlers(io: Server) {
    io.on('connection', (socket) => {
        socket.on('join', (message: string) => joinRoom(message, socket));
        socket.on('start', (message: string) => startGame(message, socket));
    });
}

export const config = {
    api: {
        bodyParser: false
    }
}

export default ioHandler
