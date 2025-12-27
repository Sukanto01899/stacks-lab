import { uintCV } from '@stacks/transactions';
import { CONTRACTS } from '@/lib/contracts';
import { readContract } from '@/lib/stacks';

export async function getOwnedAvatar(address: string, networkType: 'mainnet' | 'testnet' = 'testnet'): Promise<number | null> {
    // This function is largely a placeholder. In production, use Hiro API /extended/v1/tokens/nft/holdings.

    const contracts = networkType === 'mainnet' ? CONTRACTS.MAINNET : CONTRACTS.TESTNET;
    const [cAddr, cName] = contracts.AVATARS.split('.');

    try {
        // Check token #1
        const result = await readContract(
            cAddr,
            cName,
            'get-owner',
            [uintCV(1)],
            networkType
        );

        // Result is (ok (some principal)) or (ok none)
        // cvToJSON of (ok (some principal)) -> { type: "success", value: { type: "some", value: "ST..." } }
        if (result && result.value && result.value.value === address) {
            return 1;
        }

        return null;
    } catch (e) {
        console.error("Error checking avatar ownership:", e);
        return null;
    }
}
