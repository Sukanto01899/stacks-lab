import { STACKS_MAINNET, STACKS_TESTNET } from '@stacks/network';
import { fetchCallReadOnlyFunction, standardPrincipalCV, cvToJSON } from '@stacks/transactions';
import { env } from '../config';

// Configuration
// Using constants as classes appear unavailable in this version
const network = env.NODE_ENV === 'production' ? STACKS_MAINNET : STACKS_TESTNET;

// sBTC Contract
// Mainnet: SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token
// Testnet: ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.sbtc-token
const SBTC_CONTRACT_ADDRESS = env.NODE_ENV === 'production'
    ? 'SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4'
    : 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
const SBTC_CONTRACT_NAME = 'sbtc-token';

// Simple in-memory cache
const balanceCache = new Map<string, { balance: number, timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function getSbtcBalance(address: string): Promise<number> {
    // Check cache
    const cached = balanceCache.get(address);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.balance;
    }

    try {
        const result = await fetchCallReadOnlyFunction({
            contractAddress: SBTC_CONTRACT_ADDRESS,
            contractName: SBTC_CONTRACT_NAME,
            functionName: 'get-balance',
            functionArgs: [standardPrincipalCV(address)],
            network: network,
            senderAddress: address,
        });

        const json = cvToJSON(result);
        const balance = json.value ? parseInt(json.value.value) : 0;

        // Update cache
        balanceCache.set(address, { balance, timestamp: Date.now() });

        return balance;
    } catch (error) {
        console.error(`Error fetching sBTC balance for ${address}:`, error);
        throw new Error('Failed to fetch sBTC balance');
    }
}

export async function getSbtcHistory(address: string) {
    // In a real app, this would query a Hiro API indexer or a custom DB
    // For now, we'll return a mock or empty list as the Hiro API for FT events requires specific endpoints
    return [];
}
