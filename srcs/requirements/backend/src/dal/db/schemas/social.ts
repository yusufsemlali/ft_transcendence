import { pgTable, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './users';
import { friendshipStatusEnum } from './enums';

export const friendships = pgTable('friendships', {
    id: uuid('id').primaryKey().defaultRandom(),
    senderId: uuid('sender_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    receiverId: uuid('receiver_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    status: friendshipStatusEnum('status').default('pending').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
    unq: uniqueIndex('unq_friendship').on(
        sql`LEAST(${t.senderId}, ${t.receiverId})`,
        sql`GREATEST(${t.senderId}, ${t.receiverId})`
    )
}));
