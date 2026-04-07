import { Server as SocketIOServer, Socket } from 'socket.io';
import userService from './userService';
import messageService from './messageService';
import roomService from './roomService';
import { ChatUser } from '../types/chatUser';

class SocketService {
  private io: SocketIOServer;

  constructor(io: SocketIOServer) {
    this.io = io;
  }

  async userJoinRoom(socket: Socket, user: ChatUser & { sessionId?: string }, room: string): Promise<void> {
    // Add user to service
    userService.addUser(socket.id, user, room);
    const persistedRoom = await roomService.ensureRoom(room, user.id);

    // Join socket to room
    socket.join(room);

    // Notify others in the room
    this.io.to(room).emit('user:joined', {
      userId: user.id,
      username: user.username,
      message: `${user.username} joined the room`,
    });

    // Send previous messages to the new user
    const roomDatabaseId = await roomService.getRoomDatabaseId(persistedRoom.id);
    const previousMessages = roomDatabaseId
      ? await messageService.getMessagesByRoom(roomDatabaseId)
      : [];
    socket.emit('messages:history', previousMessages);

    // Send current users in room
    const usersInRoom = userService.getUsersInRoom(room);
    this.io.to(room).emit('users:list', usersInRoom);

    console.log(`User ${user.username} joined room: ${room}`);
  }

  async userLeaveRoom(socket: Socket): Promise<void> {
    const user = userService.getUserBySocketId(socket.id);

    if (user) {
      const room = user.room;
      
      // Remove user
      userService.removeUser(user.id);

      // Leave socket from room
      if (room) {
        socket.leave(room);

        // Notify others
        this.io.to(room).emit('user:left', {
          userId: user.id,
          username: user.username,
          message: `${user.username} left the room`,
        });

        // Send updated user list
        const usersInRoom = userService.getUsersInRoom(room);
        this.io.to(room).emit('users:list', usersInRoom);
      }

      console.log(`User ${user.username} left room: ${room}`);
    }
  }

  async broadcastMessage(socket: Socket, content: string): Promise<void> {
    const user = userService.getUserBySocketId(socket.id);

    if (!user || !user.room) {
      socket.emit('error', 'User not in a room');
      return;
    }

    const roomDatabaseId = await roomService.getRoomDatabaseId(user.room);
    if (!roomDatabaseId) {
      socket.emit('error', 'Room not found');
      return;
    }

    const message = await messageService.addMessage(user.id, user.username, content, roomDatabaseId);
    await roomService.touchRoom(user.room);

    // Broadcast to room
    this.io.to(user.room).emit('message:new', message);

    console.log(`Message in ${user.room} from ${user.username}: ${content}`);
  }

  broadcastUserTyping(socket: Socket, isTyping: boolean): void {
    const user = userService.getUserBySocketId(socket.id);

    if (!user || !user.room) {
      return;
    }

    // Broadcast to others in room (not to sender)
    socket.to(user.room).emit('user:typing', {
      userId: user.id,
      username: user.username,
      isTyping,
    });
  }

  async getRoomInfo(room: string): Promise<object> {
    const roomMetadata = await roomService.getRoom(room);
    const users = userService.getUsersInRoom(room);
    const roomDatabaseId = await roomService.getRoomDatabaseId(room);
    const messages = roomDatabaseId
      ? await messageService.getMessagesByRoom(roomDatabaseId, 10)
      : [];

    return {
      room,
      userCount: users.length,
      users,
      messageCount: messages.length,
      createdAt: roomMetadata?.createdAt ?? new Date(),
    };
  }

  async getStats(): Promise<object> {
    return {
      totalUsers: userService.getAllUsers().length,
      totalMessages: await messageService.getTotalMessageCount(),
      totalRooms: await roomService.getRoomCount(),
    };
  }
}

export default SocketService;
