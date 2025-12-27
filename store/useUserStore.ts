import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserSession {
    address: string;
    stxAddress: string; // Mainnet/Testnet specific
    btcName: string | null;
    avatarUrl: string | null;
    isAuthenticated: boolean;
}

interface UserState {
    user: UserSession | null;
    setUser: (user: UserSession) => void;
    logout: () => void;
    setBtcName: (name: string) => void;
}

export const useUserStore = create<UserState>()(
    persist(
        (set) => ({
            user: null,
            setUser: (user) => set({ user }),
            logout: () => set({ user: null }),
            setBtcName: (name) =>
                set((state) => ({
                    user: state.user ? { ...state.user, btcName: name } : null,
                })),
        }),
        {
            name: 'stackshub-user-storage',
        }
    )
);
