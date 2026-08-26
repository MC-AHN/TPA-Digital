import 'dotenv/config'; // <-- Tambahkan baris ini di paling atas
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.js";
import { createClient } from "@supabase/supabase-js";

// 1, LOAD ENV


// 2. Setup Connection
export const client = postgres(process.env.DATABASE_URL);
export const db = drizzle(client, { schema });
export const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);