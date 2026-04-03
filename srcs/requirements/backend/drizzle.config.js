import { defineConfig } from 'drizzle-kit';

export default defineConfig({
    schema: './src/dal/db/schema.ts',
    out: './src/dal/db/drizzle',
    dialect: 'postgresql',
    // ADD THIS LINE: Tell Drizzle to look at both schemas during push
    schemaFilter: ['public', 'auth'], 
    dbCredentials: {
        url: process.env.DATABASE_URL,
    },
});
