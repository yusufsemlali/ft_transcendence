import { Socket, Server as SocketIOServer } from 'socket.io';
import SocketService from '../services/socketService';
import { AuthenticatedSocketUser } from '../types/chatUser';

class SocketController {
  private socketService: SocketService;
  private readonly maxMessageLength = 500;

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

  async handleUserJoin(socket: Socket, data: { room: string }): Promise<void> {
    try {
      const room = data?.room?.trim().toLowerCase();
      const user = socket.data.user as AuthenticatedSocketUser | undefined;

      if (!user || !user.id || !room) {
        socket.emit('error', 'Invalid user or room data');
        return;
      }

      await this.socketService.userJoinRoom(socket, user, room);
      socket.emit('room:joined', { room, message: `Joined room: ${room}` });
    } catch (error) {
      console.error('Error joining room:', error);
      socket.emit('error', 'Failed to join room');
    }
  }

  async handleMessage(socket: Socket, data: { content: string }): Promise<void> {
    try {
      const content = typeof data.content === 'string'
        ? data.content.trim()
        : '';

      if (!content) {
        socket.emit('error', 'Invalid message content');
        return;
      }

      if (content.length > this.maxMessageLength) {
        socket.emit('error', `Message exceeds ${this.maxMessageLength} characters`);
        return;
      }

      await this.socketService.broadcastMessage(socket, content);
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

  async handleGetRoomInfo(socket: Socket, data: { room: string }): Promise<void> {
    try {
      const room = data?.room?.trim().toLowerCase();
      if (!room) {
        socket.emit('error', 'Invalid room data');
        return;
      }

      const roomInfo = await this.socketService.getRoomInfo(room);
      socket.emit('room:info', roomInfo);
    } catch (error) {
      console.error('Error getting room info:', error);
      socket.emit('error', 'Failed to get room info');
    }
  }

  async handleGetStats(socket: Socket): Promise<void> {
    try {
      const stats = await this.socketService.getStats();
      socket.emit('server:stats', stats);
    } catch (error) {
      console.error('Error getting stats:', error);
      socket.emit('error', 'Failed to get stats');
    }
  }

  async handleDisconnect(socket: Socket): Promise<void> {
    try {
      await this.socketService.userLeaveRoom(socket);
      console.log(`Client disconnected: ${socket.id}`);
    } catch (error) {
      console.error('Error on disconnect:', error);
    }
  }
}

export default SocketController;
