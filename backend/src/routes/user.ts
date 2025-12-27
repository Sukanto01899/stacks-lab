import { Router } from 'express';
import { getUser, upsertUser } from '../services/user';

const router = Router();

// GET /api/users/:address
router.get('/:address', async (req, res) => {
    try {
        const { address } = req.params;
        const user = await getUser(address);
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (error) {
        console.error("Error fetching user:", error);
        res.status(500).json({ error: 'Failed' });
    }
});

// POST /api/users
router.post('/', async (req, res) => {
    try {
        const { address, displayName, bio, avatarUrl } = req.body;
        if (!address) return res.status(400).json({ error: 'Address required' });

        const user = await upsertUser(address, {
            displayName,
            bio,
            avatarUrl
        });

        res.json(user);
    } catch (error) {
        console.error("Error updating user:", error);
        res.status(500).json({ error: 'Failed' });
    }
});

export default router;
