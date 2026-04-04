import { Socket, Server as SocketIOServer } from 'socket.io';
import SocketService from '../services/socketService';
import { User, Message } from '@ft-transcendence/contracts';

class SocketController {
  private socketService: SocketService;

  constructor(io: SocketIOServer) {
    this.socketService = new SocketService(io);
  }

  handleConnection(socket: Socket): void {
    console.log(`New client connected: ${socket.id}`);

    socket.emit('connection:success', {
      message: 'Connected to chat server',
      socketId: socket.id,
    });
  }

  handleUserJoin(socket: Socket, data: { user: User; room: string }): void {
    try {
      const { user, room } = data;

      if (!user || !user.id || !room) {
        socket.emit('error', 'Invalid user or room data');
        return;
      }

      this.socketService.userJoinRoom(socket, user, room);
      socket.emit('room:joined', { room, message: `Joined room: ${room}` });
    } catch (error) {
      console.error('Error joining room:', error);
      socket.emit('error', 'Failed to join room');
    }
  }

  handleMessage(socket: Socket, data: { content: string }): void {
    try {
      if (!data.content || typeof data.content !== 'string') {
        socket.emit('error', 'Invalid message content');
        return;
      }

      this.socketService.broadcastMessage(socket, data.content.trim());
    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('error', 'Failed to send message');
    }
  }

  handleTyping(socket: Socket, data: { isTyping: boolean }): void {
    try {
      this.socketService.broadcastUserTyping(socket, data.isTyping);
    } catch (error) {
      console.error('Error broadcasting typing:', error);
    }
  }

  handleGetRoomInfo(socket: Socket, data: { room: string }): void {
    try {
      const roomInfo = this.socketService.getRoomInfo(data.room);
      socket.emit('room:info', roomInfo);
    } catch (error) {
      console.error('Error getting room info:', error);
      socket.emit('error', 'Failed to get room info');
    }
  }

  handleGetStats(socket: Socket): void {
    try {
      const stats = this.socketService.getStats();
      socket.emit('server:stats', stats);
    } catch (error) {
      console.error('Error getting stats:', error);
      socket.emit('error', 'Failed to get stats');
    }
  }

  handleDisconnect(socket: Socket): void {
    try {
      this.socketService.userLeaveRoom(socket);
      console.log(`Client disconnected: ${socket.id}`);
    } catch (error) {
      console.error('Error on disconnect:', error);
    }
  }
}

export default SocketController;

