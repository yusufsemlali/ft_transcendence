import { eq } from 'drizzle-orm';
import { Room } from '@ft-transcendence/contracts';
import { db } from '../db';
import { chatRooms } from '../db/schema';

class RoomService {
  private normalizeRoomSlug(roomSlug: string): string {
    return roomSlug.trim().toLowerCase();
  }

  async ensureRoom(roomSlug: string, createdByUserId?: string): Promise<Room> {
    const normalizedRoomSlug = this.normalizeRoomSlug(roomSlug);

    const [createdRoom] = await db
      .insert(chatRooms)
      .values({
        slug: normalizedRoomSlug,
        name: normalizedRoomSlug,
        createdByUserId,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: chatRooms.slug,
        set: {
          updatedAt: new Date(),
        },
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
    const normalizedRoomSlug = this.normalizeRoomSlug(roomSlug);
    const row = await db.query.chatRooms.findFirst({
      where: eq(chatRooms.slug, normalizedRoomSlug),
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
    const normalizedRoomSlug = this.normalizeRoomSlug(roomSlug);
    await db
      .update(chatRooms)
      .set({ updatedAt: new Date() })
      .where(eq(chatRooms.slug, normalizedRoomSlug));
  }

  async removeRoom(roomSlug: string): Promise<void> {
    const normalizedRoomSlug = this.normalizeRoomSlug(roomSlug);
    await db.delete(chatRooms).where(eq(chatRooms.slug, normalizedRoomSlug));
  }

  async getRoomCount(): Promise<number> {
    return db.$count(chatRooms);
  }

  async getRoomDatabaseId(roomSlug: string): Promise<string | null> {
    const normalizedRoomSlug = this.normalizeRoomSlug(roomSlug);
    const row = await db.query.chatRooms.findFirst({
      where: eq(chatRooms.slug, normalizedRoomSlug),
      columns: { id: true },
    });

    return row?.id ?? null;
  }
}

export default new RoomService();
