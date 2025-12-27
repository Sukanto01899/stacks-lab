import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config';
import { createRedisClient } from './services/realtime';
import sbtcRoutes from './routes/sbtc';
import chatRoutes from './routes/chat';
import userRoutes from './routes/user';
import { saveMessage } from './services/chat';

const app = express();
const httpServer = createServer(app);

// Setup Socket.IO with Redis Adapter
const pubClient = createRedisClient();
const subClient = pubClient.duplicate();

Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
    console.log('Redis Pub/Sub connected');
}).catch(err => {
    console.error('Redis Pub/Sub connection failed:', err);
});

const io = new Server(httpServer, {
    cors: {
        origin: env.FRONTEND_URL,
        methods: ["GET", "POST"]
    },
    adapter: createAdapter(pubClient, subClient)
});

app.use(helmet());
app.use(cors({ origin: env.FRONTEND_URL }));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', env: env.NODE_ENV, db: 'connected' });
});

// API Routes
app.use('/api/sbtc', sbtcRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/users', userRoutes);

// WebSocket connection
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join_chat', (conversationId) => {
        socket.join(conversationId);
        console.log(`User ${socket.id} joined chat ${conversationId}`);
    });

    socket.on('send_message', async (data) => {
        try {
            // Persist to DB
            const saved = await saveMessage({
                conversationId: data.conversationId,
                senderAddress: data.senderAddress,
                content: data.content,
                isEncrypted: data.isEncrypted
            });

            // Broadcast the saved message (with ID and timestamp)
            const broadcastData = {
                ...data,
                id: saved.id,
                createdAt: saved.createdAt
            };

            io.to(data.conversationId).emit('new_message', broadcastData);
        } catch (e) {
            console.error("Failed to save message:", e);
            // Fallback: emit original data (ephemeral)
            io.to(data.conversationId).emit('new_message', data);
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

httpServer.listen(env.PORT, () => {
    console.log(`Server running on port ${env.PORT}`);
});
