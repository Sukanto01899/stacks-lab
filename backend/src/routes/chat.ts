import { Router } from 'express';
import { getMessages, createConversation, getConversations, searchUsers, updateConversationStatus, getConversationById } from '../services/chat';

const router = Router();

// GET /api/chat/:id/details
router.get('/:id/details', async (req, res) => {
    try {
        const { id } = req.params;
        const convo = await getConversationById(id);
        if (!convo) return res.status(404).json({ error: 'Not found' });
        res.json(convo);
    } catch (error) {
        console.error("Error fetching conversation details:", error);
        res.status(500).json({ error: 'Failed' });
    }
});

// GET /api/chat/search?q=...
router.get('/search', async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || typeof q !== 'string') return res.status(400).json({ error: 'Query required' });
        const users = await searchUsers(q);
        res.json(users);
    } catch (error) {
        console.error("Error searching users:", error);
        res.status(500).json({ error: 'Search failed' });
    }
});

// GET /api/chat/conversations?user=...
router.get('/conversations', async (req, res) => {
    try {
        const { user } = req.query;
        if (!user || typeof user !== 'string') return res.status(400).json({ error: 'User address required' });
        const convos = await getConversations(user);
        res.json(convos);
    } catch (error) {
        console.error("Error fetching conversations:", error);
        res.status(500).json({ error: 'Failed to fetch conversations' });
    }
});

// POST /api/chat/request
// Body: { initiator: string, recipient: string }
router.post('/request', async (req, res) => {
    try {
        const { initiator, recipient } = req.body;
        if (!initiator || !recipient) return res.status(400).json({ error: 'Missing fields' });
        const result = await createConversation(initiator, recipient);
        res.json(result);
    } catch (error) {
        console.error("Error creating conversation:", error);
        res.status(500).json({ error: 'Failed to create conversation' });
    }
});

// POST /api/chat/:id/accept
router.post('/:id/accept', async (req, res) => {
    try {
        const { id } = req.params;
        await updateConversationStatus(id, 'ACTIVE');
        res.json({ success: true });
    } catch (error) {
        console.error("Error accepting conversation:", error);
        res.status(500).json({ error: 'Failed' });
    }
});

// GET /api/chat/:conversationId/messages
router.get('/:conversationId/messages', async (req, res) => {
    try {
        const { conversationId } = req.params;
        const history = await getMessages(conversationId);
        res.json(history);
    } catch (error) {
        console.error("Error fetching messages:", error);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});

export default router;
