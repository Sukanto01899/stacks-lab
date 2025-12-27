import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const configSchema = z.object({
    PORT: z.string().transform(Number).default('3001'),
    FRONTEND_URL: z.string().url().default('http://localhost:3000'),
    REDIS_URL: z.string().url().default('redis://localhost:6379'),
    DATABASE_URL: z.string().url(),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

const _env = {
    PORT: process.env.PORT,
    FRONTEND_URL: process.env.FRONTEND_URL || process.env.CORS_ORIGIN, // Support both naming conventions
    REDIS_URL: process.env.REDIS_URL,
    DATABASE_URL: process.env.DATABASE_URL,
    NODE_ENV: process.env.NODE_ENV,
};

const result = configSchema.safeParse(_env);

if (!result.success) {
    console.error("❌ Invalid environment variables:", result.error.format());
    process.exit(1);
}

export const env = result.data;
