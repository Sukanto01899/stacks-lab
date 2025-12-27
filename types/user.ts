export interface User {
    address: string;
    stxAddress: string;
    btcName: string | null;
    isAuthenticated: boolean;
    reputationScore?: number;
    publicKey?: string; // For encryption
}

export interface UserProfile {
    handle: string;
    address: string;
    avatarUrl?: string;
    bio?: string;
    holdings?: {
        stx: string;
        sbtc: string;
        tokens: TokenBalance[];
    };
    reputation: number;
}

export interface TokenBalance {
    contractAddress: string;
    symbol: string;
    balance: string;
    decimals: number;
}
