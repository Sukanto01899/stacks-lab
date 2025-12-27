import { STACKS_MAINNET, STACKS_TESTNET } from '@stacks/network';

const networkEnv = process.env.NEXT_PUBLIC_STACKS_NETWORK || 'testnet';
export const network = networkEnv === 'mainnet' ? STACKS_MAINNET : STACKS_TESTNET;

export function truncateAddress(address: string) {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export async function resolveBnsName(name: string, networkType: 'mainnet' | 'testnet' = 'testnet'): Promise<string | null> {
    const baseUrl = networkType === 'mainnet'
        ? 'https://api.mainnet.hiro.so'
        : 'https://api.testnet.hiro.so';

    try {
        const response = await fetch(`${baseUrl}/v1/names/${name}`);
        if (!response.ok) return null;
        const data = await response.json();
        return data.address || null;
    } catch (e) {
        console.error('Error resolving BNS name:', e);
        return null;
    }
}

export async function fetchBtcName(address: string, networkType: 'mainnet' | 'testnet' = 'testnet'): Promise<string | null> {
    const baseUrl = networkType === 'mainnet'
        ? 'https://api.mainnet.hiro.so'
        : 'https://api.testnet.hiro.so';

    try {
        const response = await fetch(`${baseUrl}/v1/addresses/${address}/names`);
        if (!response.ok) return null;
        const data = await response.json();
        if (data.names && data.names.length > 0) {
            return data.names[0];
        }
        return null;
    } catch (e) {
        console.error('Error fetching BNS name:', e);
        return null;
    }
}

export async function getStxBalance(address: string, networkType: 'mainnet' | 'testnet' = 'testnet'): Promise<number> {
    const baseUrl = networkType === 'mainnet'
        ? 'https://api.mainnet.hiro.so'
        : 'https://api.testnet.hiro.so';

    try {
        const response = await fetch(`${baseUrl}/extended/v1/address/${address}/balances`);
        if (!response.ok) return 0;
        const data = await response.json();
        return parseInt(data.stx.balance);
    } catch (e) {
        console.error('Error fetching STX balance:', e);
        return 0;
    }
}

import { fetchCallReadOnlyFunction, cvToJSON, ClarityValue, cvToHex, deserializeCV } from '@stacks/transactions';

export async function readContract(
    contractAddress: string,
    contractName: string,
    functionName: string,
    functionArgs: ClarityValue[],
    networkType: 'mainnet' | 'testnet' = 'testnet'
) {
    const baseUrl = networkType === 'mainnet'
        ? 'https://api.mainnet.hiro.so'
        : 'https://api.testnet.hiro.so';

    try {
        // use direct API call to avoid @stacks/network v6 vs @stacks/transactions v7 conflict
        const args = functionArgs.map(arg => cvToHex(arg));

        const response = await fetch(`${baseUrl}/v2/contracts/call-read/${contractAddress}/${contractName}/${functionName}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sender: contractAddress,
                arguments: args
            })
        });

        if (!response.ok) {
            throw new Error(`Read contract failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        if (data.okay && data.result) {
            const resultCV = deserializeCV(data.result);
            return cvToJSON(resultCV);
        } else {
            throw new Error(`Read contract returned error: ${JSON.stringify(data)}`);
        }
    } catch (e) {
        console.error(`Error reading contract ${contractName}.${functionName}:`, e);
        throw e;
    }
}
