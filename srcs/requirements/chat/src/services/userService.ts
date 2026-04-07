import { ChatUser } from '../types/chatUser';

interface UserWithSocket extends ChatUser {
  socketId: string;
  room?: string;
  isOnline: boolean;
  lastSeen: Date;
  sessionId?: string;
}

class UserService {
  private users: Map<string, UserWithSocket> = new Map();
  private usersBySocket: Map<string, string> = new Map();

  addUser(
    socketId: string,
    user: ChatUser & { sessionId?: string },
    room?: string
  ): UserWithSocket {
    const userWithSocket: UserWithSocket = {
      ...user,
      socketId,
      room,
      isOnline: true,
      lastSeen: new Date(),
    };

    this.users.set(user.id, userWithSocket);
    this.usersBySocket.set(socketId, user.id);

    return userWithSocket;
  }

  removeUser(userId: string): UserWithSocket | undefined {
    const user = this.users.get(userId);
    if (user) {
      this.usersBySocket.delete(user.socketId);
      this.users.delete(userId);
    }
    return user;
  }

  getUserBySocketId(socketId: string): UserWithSocket | undefined {
    const userId = this.usersBySocket.get(socketId);
    return userId ? this.users.get(userId) : undefined;
  }

  getUserById(userId: string): UserWithSocket | undefined {
    return this.users.get(userId);
  }

  updateUserRoom(userId: string, room: string): void {
    const user = this.users.get(userId);
    if (user) {
      user.room = room;
      user.lastSeen = new Date();
    }
  }

  getUsersInRoom(room: string): UserWithSocket[] {
    return Array.from(this.users.values()).filter((user) => user.room === room);
  }

  getAllUsers(): UserWithSocket[] {
    return Array.from(this.users.values());
  }

  updateLastSeen(userId: string): void {
    const user = this.users.get(userId);
    if (user) {
      user.lastSeen = new Date();
    }
  }
}

export default new UserService();
