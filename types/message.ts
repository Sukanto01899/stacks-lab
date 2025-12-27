export interface Message {
    id: string;
    senderAddress: string;
    recipientAddress: string;
    content: string; // Encrypted blob reference or plaintext if public
    timestamp: number;
    isEncrypted: boolean;
    status: 'sent' | 'delivered' | 'read';
}

export interface ChatConversation {
    id: string;
    participants: string[]; // Addresses
    lastMessage?: Message;
    unreadCount: number;
    updatedAt: number;
}
