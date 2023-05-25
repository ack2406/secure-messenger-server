import { Server } from 'socket.io';

const port = 3000;

const io = new Server(port);

io.on('connection', (socket) => {
    console.log('new connection');
    }
);

console.log(`Server started on port ${port}`);