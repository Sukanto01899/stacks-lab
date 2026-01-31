'use client';

import { useEffect, useState, useCallback } from 'react';
import { UserData } from '@stacks/auth';
import { AppConfig, UserSession } from '@stacks/connect';
import { getUserSession } from '@/lib/stacks-client';
import { useUserStore } from '@/store/useUserStore';
import { fetchBtcName } from '@/lib/stacks';
import { env } from '@/lib/config';

export function useWallet() {
    const { user, setUser, logout, setBtcName } = useUserStore();
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        const userSession = getUserSession();
        if (userSession.isUserSignedIn()) {
            const userData = userSession.loadUserData();
            const network = env.NEXT_PUBLIC_STACKS_NETWORK === 'mainnet' ? 'mainnet' : 'testnet';
            const address = network === 'mainnet'
                ? userData.profile.stxAddress.mainnet
                : userData.profile.stxAddress.testnet;

            if (!user || user.address !== address) {
                // Initial set
                setUser({
                    address: address,
                    stxAddress: address,
                    btcName: null,
                    avatarUrl: null,
                    isAuthenticated: true,
                });

                fetchBtcName(address, network).then((name) => {
                    if (name) setBtcName(name);
                });
            }
        }
    }, [user, setUser, setBtcName]);

    // Fetch extended profile (Avatar/Bio)
    useEffect(() => {
        const fetchProfile = async () => {
            if (user?.address) {
                try {
                    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'}/api/users/${user.address}`);
                    if (res.ok) {
                        const data = await res.json();
                        if (data.avatarUrl && data.avatarUrl !== user.avatarUrl) {
                            setUser({ ...user, avatarUrl: data.avatarUrl });
                        }
                    }
                } catch (e) {
                    console.error("Failed to sync profile", e);
                }
            }
        };
        fetchProfile();
    }, [user?.address, setUser]);

    const connectWallet = useCallback(async () => {
        const appDetails = {
            name: 'Stacks Lab',
            icon: typeof window !== 'undefined' ? `${window.location.origin}/logo.svg` : '',
        };

        const userSession = getUserSession();

        try {
            const { authenticate } = await import('@stacks/connect');
            authenticate({
                appDetails,
                userSession,
                manifestPath: '/manifest.json',
                onFinish: () => {
                    const userData = userSession.loadUserData();
                    const network = env.NEXT_PUBLIC_STACKS_NETWORK === 'mainnet' ? 'mainnet' : 'testnet';
                    const address = network === 'mainnet'
                        ? userData.profile.stxAddress.mainnet
                        : userData.profile.stxAddress.testnet;
                    setUser({
                        address,
                        stxAddress: address,
                        btcName: null,
                        avatarUrl: null,
                        isAuthenticated: true,
                    });

                    fetchBtcName(address, network).then((name) => {
                        if (name) setBtcName(name);
                    });
                },
                onCancel: () => {
                    // User cancelled
                },
            });
        } catch (error) {
            console.error('Failed to connect wallet:', error);
        }
    }, [setUser, setBtcName]);

    const disconnectWallet = useCallback(() => {
        const userSession = getUserSession();
        userSession.signUserOut();
        logout();
    }, [logout]);

    return {
        user,
        connectWallet,
        disconnectWallet,
        isMounted,
    };
}
