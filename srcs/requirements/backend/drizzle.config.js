import { defineConfig } from 'drizzle-kit';

export default defineConfig({
    schema: './src/dal/db/schema.ts',
    out: './src/dal/db/drizzle',
    dialect: 'postgresql',
    dbCredentials: {
        url: process.env.DATABASE_URL,
    },
});
