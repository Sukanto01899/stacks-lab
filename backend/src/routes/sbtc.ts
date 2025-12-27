import { Router } from 'express';
import { getSbtcBalance, getSbtcHistory } from '../services/sbtc';

const router = Router();

// GET /api/sbtc/balance/:address
router.get('/balance/:address', async (req, res) => {
    try {
        const { address } = req.params;
        const balance = await getSbtcBalance(address);
        res.json({ address, balance, currency: 'sBTC', unit: 'satoshis' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch balance' });
    }
});

// GET /api/sbtc/history/:address
router.get('/history/:address', async (req, res) => {
    try {
        const { address } = req.params;
        const history = await getSbtcHistory(address);
        res.json({ address, history });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch history' });
    }
});

export default router;
