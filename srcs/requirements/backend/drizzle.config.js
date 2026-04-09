import { defineConfig } from 'drizzle-kit';

export default defineConfig({
    schema: './src/dal/db/schema.ts',
    out: './src/dal/db/drizzle',
    dialect: 'postgresql',
    schemaFilter: ['public', 'auth'],
    tablesFilter: ['!chat_rooms', '!chat_messages'],
    dbCredentials: {
        url: process.env.DATABASE_URL,
    },
});
