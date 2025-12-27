export interface UserProfile {
    address: string;
    stxAddress: string;
    btcName: string | null;
    isAuthenticated: boolean;
}

export interface Message {
    id: string;
    content: string;
    sender: string;
    timestamp: number;
    conversationId: string;
}

export interface NFT {
    asset_identifier: string;
    value: {
        hex: string;
        repr: string;
    };
}

export interface ApiResponse<T> {
    data: T;
    status: number;
    message?: string;
}
