import type { AppConfig, UserSession } from '@stacks/connect';

// Config for Stacks Connect
// Initialize lazily to avoid SSR issues
let userSession: UserSession | undefined;

export function getUserSession(): UserSession {
    if (!userSession) {
        // We use require here to ensure it's only loaded on the client
        // and to avoid top-level import issues in server builds if this file is accidentally imported.
        // However, since we are separating this file, we could use top-level import if we ensure
        // it's only imported by Client Components. But dynamic require is safer for now given the build issues.
        const { AppConfig, UserSession } = require('@stacks/connect');
        const appConfig = new AppConfig(['store_write', 'publish_data']);
        userSession = new UserSession({ appConfig });
    }
    return userSession as UserSession;
}

export function getUserData() {
    try {
        const session = getUserSession();
        if (session.isUserSignedIn()) {
            return session.loadUserData();
        }
    } catch (e) {
        return null;
    }
    return null;
}
