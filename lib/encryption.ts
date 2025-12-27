import { encryptContent, decryptContent, getPublicKeyFromPrivate } from '@stacks/encryption';
import { UserSession } from '@stacks/connect';

export { getPublicKeyFromPrivate };

// Helper to get public key from user session (if available) or profile
// Note: In a real app, you'd fetch the recipient's public key from their BNS profile or a directory.
// For E2EE, we need the recipient's public key.

export async function encryptMessage(content: string, recipientPublicKey: string): Promise<string> {
    // This is a simplified wrapper. In reality, you might sign it too.
    // @stacks/encryption encryptContent uses ECIES
    const encrypted = await encryptContent(content, { publicKey: recipientPublicKey });
    return encrypted;
}

export async function decryptMessage(encryptedContent: string, userSession: UserSession): Promise<string | null> {
    try {
        // decryptContent handles using the private key from the userSession
        // Note: decryptContent expects the userSession to be passed or available in context
        // The library signature might vary slightly by version, checking usage.
        // Usually: decryptContent(content, options)
        // The private key is accessed via userSession.appPrivateKey usually? 
        // Actually @stacks/encryption usually works with the private key directly or via the session helper.

        // For client-side decryption with the wallet, we might need to ask the wallet to decrypt 
        // if the private key isn't directly accessible (which it shouldn't be for Leather).
        // However, Stacks apps often derive an app-specific private key.

        const options = {
            // We need to pass the private key. 
            // userSession.loadUserData().appPrivateKey is the app-specific private key.
            privateKey: userSession.loadUserData().appPrivateKey
        };

        const decrypted = await decryptContent(encryptedContent, options);
        return decrypted as string;
    } catch (e) {
        console.error('Decryption failed:', e);
        return null;
    }
}
