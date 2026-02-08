import { pgTable, serial, timestamp, unique, uuid } from 'drizzle-orm/pg-core';
import { users } from './users';
import { friendshipStatusEnum } from './enums';

export const friendships = pgTable('friendships', {
    id: serial('id').primaryKey(),
    senderId: uuid('sender_id').references(() => users.id).notNull(),
    receiverId: uuid('receiver_id').references(() => users.id).notNull(),
    status: friendshipStatusEnum('status').default('pending').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
    unq: unique().on(t.senderId, t.receiverId)
}));

