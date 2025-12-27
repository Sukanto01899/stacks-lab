import { createClient } from 'redis';
import { env } from '../config';

// Primary client for general operations
const redisClient = createClient({
    url: env.REDIS_URL
});

redisClient.on('error', (err) => console.log('Redis Client Error', err));

export async function connectRedis() {
    if (!redisClient.isOpen) {
        await redisClient.connect();
    }
    return redisClient;
}

// Helper to create new clients (needed for Pub/Sub)
export function createRedisClient() {
    const client = createClient({ url: env.REDIS_URL });
    client.on('error', (err) => console.error('Redis Client Error', err));
    return client;
}

export { redisClient };
