export interface TokenLaunchData {
    name: string;
    symbol: string;
    decimals: number;
    supply: number;
    description?: string;
    logoUrl?: string;
    type: 'SIP-010' | 'SIP-021' | 'SIP-015'; // SIP-015 is NFT
}

export interface LaunchStatus {
    txId?: string;
    status: 'idle' | 'preparing' | 'broadcasting' | 'confirmed' | 'failed';
    contractAddress?: string;
    error?: string;
}
