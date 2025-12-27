import { openContractCall } from '@stacks/connect';
import { STACKS_TESTNET, STACKS_MAINNET } from '@stacks/network';
import { uintCV, principalCV, stringAsciiCV, PostConditionMode, Pc, standardPrincipalCV } from '@stacks/transactions';
import { getUserSession } from './stacks-client';
import { readContract } from './stacks';

// sBTC Contract Principals
export const SBTC_CONTRACT_TESTNET = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.sbtc-token';
export const SBTC_CONTRACT_MAINNET = 'SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token'; // Official Mainnet Deployment

export interface SbtcTransferParams {
    amount: number; // in Satoshis
    recipient: string;
    memo?: string;
    networkType?: 'mainnet' | 'testnet';
}

export async function sendSbtcTransfer({ amount, recipient, memo, networkType = 'testnet' }: SbtcTransferParams) {
    const userSession = getUserSession();
    const network = networkType === 'mainnet' ? STACKS_MAINNET : STACKS_TESTNET;
    const contractAddress = networkType === 'mainnet' ? SBTC_CONTRACT_MAINNET : SBTC_CONTRACT_TESTNET;
    const [contractPrincipal, contractName] = contractAddress.split('.');

    const senderAddress = userSession.loadUserData().profile.stxAddress[networkType];

    // Define Post-Condition to ensure user doesn't spend more than 'amount'
    // This is a security best practice
    // Define Post-Condition to ensure user doesn't spend more than 'amount'
    // This is a security best practice
    const postCondition = Pc.principal(senderAddress)
        .willSendEq(amount)
        .ft(`${contractPrincipal}.${contractName}`, 'sbtc-token');

    return new Promise((resolve, reject) => {
        openContractCall({
            contractAddress: contractPrincipal,
            contractName: contractName,
            functionName: 'transfer',
            functionArgs: [
                uintCV(amount),
                principalCV(senderAddress),
                principalCV(recipient),
                memo ? stringAsciiCV(memo) : stringAsciiCV('')
            ],
            network,
            postConditions: [postCondition],
            postConditionMode: PostConditionMode.Deny, // Strict mode
            userSession,
            onFinish: (data) => resolve(data),
            onCancel: () => reject('User cancelled transfer'),
        });
    });
}

// Read-only balance fetch via Backend Proxy (Cached)
export async function getSbtcBalance(address: string, networkType: 'mainnet' | 'testnet' = 'testnet') {
    try {
        // Use backend proxy for caching and efficiency
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
        const response = await fetch(`${backendUrl}/api/sbtc/balance/${address}`);

        if (!response.ok) {
            throw new Error('Failed to fetch from backend');
        }

        const data = await response.json();
        return data.balance || 0;
    } catch (error) {
        console.error('Error fetching sBTC balance from backend, falling back to direct node call:', error);

        // Fallback to direct node call if backend fails
        // Fallback to direct node call if backend fails
        const contractAddress = networkType === 'mainnet' ? SBTC_CONTRACT_MAINNET : SBTC_CONTRACT_TESTNET;
        const [contractPrincipal, contractName] = contractAddress.split('.');

        try {
            const result = await readContract(
                contractPrincipal,
                contractName,
                'get-balance',
                [standardPrincipalCV(address)],
                networkType
            );

            if (result && result.value) {
                return parseInt(result.value.value);
            }
            return 0;
        } catch (directError) {
            console.error('Direct sBTC fetch also failed:', directError);
            return 0;
        }
    }
}

