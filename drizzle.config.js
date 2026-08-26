import { defineConfig } from 'drizzle-kit';
import 'dotenv/config'; // <-- Tambahkan baris ini di paling atas

export default defineConfig({
    schema: './src/db/schema.js',
    out: './drizzle',
    dialect: 'postgresql',
    dbCredentials: {
        url: process.env.DATABASE_URL
    }
});