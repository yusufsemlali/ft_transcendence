import express from 'express';
import { createServer } from 'http';
import { createExpressEndpoints } from '@ts-rest/express';
import { Server as SocketIOServer } from 'socket.io';
import path from 'path';
import dotenv from 'dotenv';
import { contract } from '@ft-transcendence/contracts';
import SocketController from './controllers/socketController';
import { chatController } from './controllers/chatController';
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

// Apply ts-rest routes
createExpressEndpoints(contract.chat, chatController, app, {
  jsonQuery: true,
});

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

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
