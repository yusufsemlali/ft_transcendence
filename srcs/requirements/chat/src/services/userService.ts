import { ChatUser } from '../types/chatUser';

interface UserWithSocket extends ChatUser {
  socketId: string;
  room?: string;
  isOnline: boolean;
  lastSeen: Date;
  sessionId?: string;
}

class UserService {
  private usersBySocket: Map<string, UserWithSocket> = new Map();
  private socketsByUser: Map<string, Set<string>> = new Map();

  addUser(
    socketId: string,
    user: ChatUser & { sessionId?: string },
    room?: string
  ): UserWithSocket {
    const existingUser = this.usersBySocket.get(socketId);
    if (existingUser) {
      this.removeSocket(socketId);
    }

    const userWithSocket: UserWithSocket = {
      ...user,
      socketId,
      room,
      isOnline: true,
      lastSeen: new Date(),
    };

    this.usersBySocket.set(socketId, userWithSocket);

    const sockets = this.socketsByUser.get(user.id) ?? new Set<string>();
    sockets.add(socketId);
    this.socketsByUser.set(user.id, sockets);

    return userWithSocket;
  }

  removeSocket(socketId: string): UserWithSocket | undefined {
    const user = this.usersBySocket.get(socketId);
    if (user) {
      this.usersBySocket.delete(socketId);

      const sockets = this.socketsByUser.get(user.id);
      if (sockets) {
        sockets.delete(socketId);
        if (sockets.size === 0) {
          this.socketsByUser.delete(user.id);
        }
      }
    }
    return user;
  }

  getUserBySocketId(socketId: string): UserWithSocket | undefined {
    return this.usersBySocket.get(socketId);
  }

  getUserById(userId: string): UserWithSocket | undefined {
    const sockets = this.socketsByUser.get(userId);
    if (!sockets || sockets.size === 0) {
      return undefined;
    }

    const socketId = Array.from(sockets)[0];
    return this.usersBySocket.get(socketId);
  }

  updateUserRoom(socketId: string, room: string): void {
    const user = this.usersBySocket.get(socketId);
    if (user) {
      user.room = room;
      user.lastSeen = new Date();
    }
  }

  getUsersInRoom(room: string): UserWithSocket[] {
    const uniqueUsers = new Map<string, UserWithSocket>();

    for (const user of this.usersBySocket.values()) {
      if (user.room === room && !uniqueUsers.has(user.id)) {
        uniqueUsers.set(user.id, user);
      }
    }

    return Array.from(uniqueUsers.values());
  }

  getAllUsers(): UserWithSocket[] {
    const uniqueUsers = new Map<string, UserWithSocket>();

    for (const user of this.usersBySocket.values()) {
      if (!uniqueUsers.has(user.id)) {
        uniqueUsers.set(user.id, user);
      }
    }

    return Array.from(uniqueUsers.values());
  }

  getOccupiedRooms(): string[] {
    return Array.from(
      new Set(
        Array.from(this.usersBySocket.values())
          .map((user) => user.room)
          .filter((room): room is string => Boolean(room))
      )
    );
  }

  updateLastSeen(socketId: string): void {
    const user = this.usersBySocket.get(socketId);
    if (user) {
      user.lastSeen = new Date();
    }
  }

  isUserInRoom(userId: string, room: string): boolean {
    const sockets = this.socketsByUser.get(userId);
    if (!sockets) {
      return false;
    }

    return Array.from(sockets).some((socketId) => {
      const user = this.usersBySocket.get(socketId);
      return user?.room === room;
    });
  }
}

export default new UserService();
