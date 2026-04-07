import { eq } from 'drizzle-orm';
import { Room } from '@ft-transcendence/contracts';
import { db } from '../db';
import { chatRooms } from '../db/schema';

class RoomService {
  async ensureRoom(roomSlug: string, createdByUserId?: string): Promise<Room> {
    const existingRoom = await this.getRoom(roomSlug);

    if (existingRoom) {
      await this.touchRoom(roomSlug);
      return existingRoom;
    }

    const [createdRoom] = await db
      .insert(chatRooms)
      .values({
        slug: roomSlug,
        name: roomSlug,
        createdByUserId,
      })
      .returning();

    return {
      id: createdRoom.slug,
      name: createdRoom.name,
      description: createdRoom.description ?? undefined,
      createdAt: createdRoom.createdAt,
    };
  }

  async getRoom(roomSlug: string): Promise<Room | undefined> {
    const row = await db.query.chatRooms.findFirst({
      where: eq(chatRooms.slug, roomSlug),
    });

    if (!row) {
      return undefined;
    }

    return {
      id: row.slug,
      name: row.name,
      description: row.description ?? undefined,
      createdAt: row.createdAt,
    };
  }

  async getRooms(): Promise<Room[]> {
    const rows = await db.query.chatRooms.findMany({
      orderBy: (fields, { desc }) => [desc(fields.updatedAt)],
    });

    return rows.map((row) => ({
      id: row.slug,
      name: row.name,
      description: row.description ?? undefined,
      createdAt: row.createdAt,
    }));
  }

  async touchRoom(roomSlug: string): Promise<void> {
    await db
      .update(chatRooms)
      .set({ updatedAt: new Date() })
      .where(eq(chatRooms.slug, roomSlug));
  }

  async removeRoom(roomSlug: string): Promise<void> {
    await db.delete(chatRooms).where(eq(chatRooms.slug, roomSlug));
  }

  async getRoomCount(): Promise<number> {
    return db.$count(chatRooms);
  }

  async getRoomDatabaseId(roomSlug: string): Promise<string | null> {
    const row = await db.query.chatRooms.findFirst({
      where: eq(chatRooms.slug, roomSlug),
      columns: { id: true },
    });

    return row?.id ?? null;
  }
}

export default new RoomService();
