import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { env } from '../config';
import * as schema from './schema';

const pool = new Pool({
    connectionString: env.DATABASE_URL,
});

// For serverless environments (like Neon/Railway), connection pooling is vital.
// Drizzle with node-postgres pool handles this well.

export const db = drizzle(pool, { schema });
