import { create } from 'zustand';
import { TokenLaunchData, LaunchStatus } from '@/types/launch';

interface LaunchpadState {
    launchData: TokenLaunchData;
    launchStatus: LaunchStatus;

    setLaunchData: (data: Partial<TokenLaunchData>) => void;
    setLaunchStatus: (status: LaunchStatus) => void;
    resetLaunch: () => void;
}

const initialLaunchData: TokenLaunchData = {
    name: '',
    symbol: '',
    decimals: 6,
    supply: 1000000,
    type: 'SIP-010',
};

export const useLaunchpadStore = create<LaunchpadState>((set) => ({
    launchData: initialLaunchData,
    launchStatus: { status: 'idle' },

    setLaunchData: (data) => set((state) => ({
        launchData: { ...state.launchData, ...data }
    })),

    setLaunchStatus: (status) => set({ launchStatus: status }),

    resetLaunch: () => set({
        launchData: initialLaunchData,
        launchStatus: { status: 'idle' }
    }),
}));
