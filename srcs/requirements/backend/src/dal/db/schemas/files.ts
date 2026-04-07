import { pgTable, uuid, varchar, integer, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { users } from './users';

export const fileVisibilityEnum = pgEnum('file_visibility', ['public', 'private']);

export const files = pgTable('files', {
    id: uuid('id').primaryKey().defaultRandom(),
    uploaderId: uuid('uploader_id').references(() => users.id).notNull(),
    
    originalName: varchar('original_name', { length: 255 }).notNull(),
    savedName: varchar('saved_name', { length: 255 }).notNull().unique(),
    mimeType: varchar('mime_type', { length: 100 }).notNull(), // e.g., 'image/png', 'application/pdf'
    sizeBytes: integer('size_bytes').notNull(),
    
    // The path where it is stored (e.g., '/uploads/avatars/123.png')
    url: varchar('url', { length: 500 }).notNull(), 
    
    visibility: fileVisibilityEnum('visibility').default('public').notNull(),
    
    createdAt: timestamp('created_at').defaultNow().notNull(),
});
