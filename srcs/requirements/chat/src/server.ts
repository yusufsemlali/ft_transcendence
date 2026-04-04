import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { initServer } from '@ts-rest/express';
import path from 'path';
import dotenv from 'dotenv';
import { contract } from '@ft-transcendence/contracts';
import SocketController from './controllers/socketController';
import socketConfig from './config/socket';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, socketConfig);

const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Initialize Socket Controller
const socketController = new SocketController(io);

// Initialize ts-rest server with chat contract
const s = initServer();

// export const chatController = s.router(contract.chat, {
//   getStats: async () => {
//     return {
//       status: 200 as const,
//       body: {
//         connectedUsers: io.engine.clientsCount,
//         activeRooms: io.sockets.adapter.rooms.size,
//         totalMessages: 0, // Track this in your service
//       },
//     };
//   },
//   getRoomInfo: async ({ params }) => {
//     const room = io.sockets.adapter.rooms.get(params.roomId);
//     if (!room) {
//       return {
//         status: 404 as const,
//         body: { message: 'Room not found' },
//       };
//     }
//     return {
//       status: 200 as const,
//       body: {
//         room: params.roomId,
//         userCount: room.size,
//         messageCount: 0, // Track this in your service
//         createdAt: new Date(),
//       },
//     };
//   },
//   getRooms: async () => {
//     const rooms = Array.from(io.sockets.adapter.rooms.keys())
//       .filter(room => !io.sockets.adapter.sids.has(room))
//       .map(room => ({
//         id: room,
//         name: room,
//         description: null,
//         createdAt: new Date(),
//       }));
//     return {
//       status: 200 as const,
//       body: rooms,
//     };
//   },
//   getRoomMessages: async ({ params }) => {
//     // This would be implemented with actual message storage
//     return {
//       status: 200 as const,
//       body: [],
//     };
//   },
// });

// Apply ts-rest routes
// app.use('/api', chatController);

// Serve test client
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Socket.io connection handling
io.on('connection', (socket) => {
  socketController.handleConnection(socket);

  // User events
  socket.on('user:join', (data) => socketController.handleUserJoin(socket, data));

  // Message events
  socket.on('message:send', (data) => socketController.handleMessage(socket, data));

  // Typing events
  socket.on('user:typing', (data) => socketController.handleTyping(socket, data));

  // Info events
  socket.on('room:getInfo', (data) => socketController.handleGetRoomInfo(socket, data));
  socket.on('server:getStats', () => socketController.handleGetStats(socket));

  // Disconnect event
  socket.on('disconnect', () => socketController.handleDisconnect(socket));
});

httpServer.listen(PORT, () => {
  console.log(`Chat server running on port ${PORT}`);
  console.log(`Test client available at http://localhost:${PORT}`);
});
