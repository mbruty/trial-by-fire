import { Server } from 'socket.io'
import mongoConnection from '../../../database/mongoConnection';
import joinRoom from '../../../sockets/joinRoom';

// Plug the socket io instance into the server instance
const ioHandler = async (req: NextApiRequest, res: NextApiResponse) => {
    // Typescript thinks that socket doesn't have a server attribute when it does
    // @ts-ignore
    if (!res.socket.server.io) {
        console.log('*First use, starting socket.io')
        // @ts-ignore
        const io = new Server(res.socket.server)
        setupSocketHandlers(io);
        // @ts-ignore
        res.socket.server.io = io
        // @ts-ignore
    } else if(!res.socket.server.db) {
        await mongoConnection();
        // @ts-ignore
        res.socket.server.db = true;
    } else {
        console.log('socket.io already running')
    }
    res.end()
}



function setupSocketHandlers(io: Server) {
    io.on('connection', (socket) => {
        socket.on('join', (message: string) => joinRoom(message, socket));
    });
}

export const config = {
    api: {
        bodyParser: false
    }
}

export default ioHandler
