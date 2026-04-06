import { Server as SocketIOServer, Socket } from 'socket.io';
import userService from './userService';
import messageService from './messageService';
import roomService from './roomService';
import { User } from '@ft-transcendence/contracts';

class SocketService {
  private io: SocketIOServer;

  constructor(io: SocketIOServer) {
    this.io = io;
  }

  userJoinRoom(socket: Socket, user: User, room: string): void {
    // Add user to service
    userService.addUser(socket.id, user, room);
    roomService.ensureRoom(room);

    // Join socket to room
    socket.join(room);

    // Notify others in the room
    this.io.to(room).emit('user:joined', {
      userId: user.id,
      username: user.username,
      message: `${user.username} joined the room`,
    });

    // Send previous messages to the new user
    const previousMessages = messageService.getMessagesByRoom(room);
    socket.emit('messages:history', previousMessages);

    // Send current users in room
    const usersInRoom = userService.getUsersInRoom(room);
    this.io.to(room).emit('users:list', usersInRoom);

    console.log(`User ${user.username} joined room: ${room}`);
  }

  userLeaveRoom(socket: Socket): void {
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

        if (usersInRoom.length === 0) {
          roomService.removeRoom(room);
        }
      }

      console.log(`User ${user.username} left room: ${room}`);
    }
  }

  broadcastMessage(socket: Socket, content: string): void {
    const user = userService.getUserBySocketId(socket.id);

    if (!user || !user.room) {
      socket.emit('error', 'User not in a room');
      return;
    }

    const message = messageService.addMessage(user.id, user.username, content, user.room);
    roomService.touchRoom(user.room);

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

  getRoomInfo(room: string): object {
    const roomMetadata = roomService.getRoom(room);
    const users = userService.getUsersInRoom(room);
    const messages = messageService.getMessagesByRoom(room, 10);

    return {
      room,
      userCount: users.length,
      users,
      messageCount: messages.length,
      createdAt: roomMetadata?.createdAt ?? new Date(),
    };
  }

  getStats(): object {
    return {
      totalUsers: userService.getAllUsers().length,
      totalMessages: messageService.getTotalMessageCount(),
      totalRooms: roomService.getRoomCount(),
    };
  }
}

export default SocketService;
