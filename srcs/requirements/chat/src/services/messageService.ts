import { desc, eq } from 'drizzle-orm';
import { Message } from '@ft-transcendence/contracts';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { chatMessages } from '../db/schema';

class MessageService {
  async addMessage(
    userId: string,
    username: string,
    content: string,
    roomId: string
  ): Promise<Message> {
    const message: Message = {
      id: uuidv4(),
      userId,
      username,
      content,
      timestamp: new Date(),
    };

    await db.insert(chatMessages).values({
      id: message.id,
      roomId,
      userId,
      username,
      content,
      createdAt: message.timestamp,
    });

    return message;
  }

  async getMessagesByRoom(roomId: string, limit: number = 50, offset: number = 0): Promise<Message[]> {
    const rows = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.roomId, roomId))
      .orderBy(desc(chatMessages.createdAt))
      .limit(limit)
      .offset(offset);

    return rows
      .map((row) => ({
        id: row.id,
        userId: row.userId,
        username: row.username,
        content: row.content,
        timestamp: row.createdAt,
      }))
      .reverse();
  }

  async clearRoomMessages(roomId: string): Promise<void> {
    await db.delete(chatMessages).where(eq(chatMessages.roomId, roomId));
  }

  async getMessageHistory(limit: number = 100): Promise<Message[]> {
    const rows = await db
      .select()
      .from(chatMessages)
      .orderBy(desc(chatMessages.createdAt))
      .limit(limit);

    return rows
      .map((row) => ({
        id: row.id,
        userId: row.userId,
        username: row.username,
        content: row.content,
        timestamp: row.createdAt,
      }))
      .reverse();
  }

  async getTotalMessageCount(): Promise<number> {
    return db.$count(chatMessages);
  }
}

export default new MessageService();
