
import { Storage } from '@stacks/storage';
import { UserSession } from '@stacks/connect';

// Initialize Storage
export function getStorage(userSession: UserSession) {
    return new Storage({ userSession: userSession as any });
}

export async function uploadFile(
    userSession: UserSession,
    filename: string,
    content: string | Buffer,
    options: { encrypt?: boolean; dangerouslyIgnoreEtag?: boolean } = {}
) {
    const storage = getStorage(userSession);
    const fileUrl = await storage.putFile(filename, content, {
        encrypt: options.encrypt ?? true, // Default to encrypted
        dangerouslyIgnoreEtag: options.dangerouslyIgnoreEtag,
    });
    return fileUrl;
}

export async function getFile(
    userSession: UserSession,
    filename: string,
    options: { decrypt?: boolean } = {}
) {
    const storage = getStorage(userSession);
    const content = await storage.getFile(filename, {
        decrypt: options.decrypt ?? true,
    });
    return content;
}

export async function getPublicFile(
    userSession: UserSession,
    filename: string,
    username: string // The BNS name or identity address of the file owner
) {
    const storage = getStorage(userSession);
    // To get a file from another user, we need their Gaia hub URL.
    // This is a more advanced lookup usually handled by looking up the profile.
    // For now, we assume we can fetch it if we know the hub.
    // @stacks/storage has getFileFromUrl if we know the full URL.
    // Or storage.getFile(filename, { username, decrypt: false })

    return await storage.getFile(filename, {
        username,
        decrypt: false
    });
}
