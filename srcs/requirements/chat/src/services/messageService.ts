import { Message } from '@ft-transcendence/contracts';
import { v4 as uuidv4 } from 'uuid';

class MessageService {
  private messages: Map<string, Message[]> = new Map();
  private messageHistory: Message[] = [];
  private maxMessagesPerRoom: number = 100;

  addMessage(
    userId: string,
    username: string,
    content: string,
    room: string
  ): Message {
    const message: Message = {
      id: uuidv4(),
      userId,
      username,
      content,
      timestamp: new Date(),
    };

    // Store in room-specific messages
    if (!this.messages.has(room)) {
      this.messages.set(room, []);
    }

    const roomMessages = this.messages.get(room)!;
    roomMessages.push(message);

    // Keep only the last N messages
    if (roomMessages.length > this.maxMessagesPerRoom) {
      roomMessages.shift();
    }

    // Store in general history
    this.messageHistory.push(message);

    return message;
  }

  getMessagesByRoom(room: string, limit: number = 50, offset: number = 0): Message[] {
    const roomMessages = this.messages.get(room) || [];
    const startIndex = Math.max(roomMessages.length - offset - limit, 0);
    const endIndex = Math.max(roomMessages.length - offset, 0);
    return roomMessages.slice(startIndex, endIndex);
  }

  clearRoomMessages(room: string): void {
    this.messages.delete(room);
  }

  getMessageHistory(limit: number = 100): Message[] {
    return this.messageHistory.slice(-limit);
  }

  getRoomCount(): number {
    return this.messages.size;
  }

  getTotalMessageCount(): number {
    return this.messageHistory.length;
  }
}

export default new MessageService();
