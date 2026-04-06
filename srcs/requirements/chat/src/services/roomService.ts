import { Room } from '@ft-transcendence/contracts';

interface RoomState extends Room {
  lastActivityAt: Date;
}

class RoomService {
  private rooms: Map<string, RoomState> = new Map();

  ensureRoom(roomId: string): RoomState {
    const existingRoom = this.rooms.get(roomId);

    if (existingRoom) {
      existingRoom.lastActivityAt = new Date();
      return existingRoom;
    }

    const room: RoomState = {
      id: roomId,
      name: roomId,
      createdAt: new Date(),
      lastActivityAt: new Date(),
    };

    this.rooms.set(roomId, room);
    return room;
  }

  getRoom(roomId: string): RoomState | undefined {
    return this.rooms.get(roomId);
  }

  getRooms(): Room[] {
    return Array.from(this.rooms.values()).map(({ lastActivityAt: _lastActivityAt, ...room }) => room);
  }

  touchRoom(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (room) {
      room.lastActivityAt = new Date();
    }
  }

  removeRoom(roomId: string): void {
    this.rooms.delete(roomId);
  }

  getRoomCount(): number {
    return this.rooms.size;
  }
}

export default new RoomService();
