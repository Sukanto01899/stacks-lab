'use client';

import { useEffect, useState } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { Button } from '@/ui/button';
import { Loader2, Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function AuthGuard({ children }: { children: React.ReactNode }) {
    const { user, isMounted, connectWallet } = useWallet();
    const router = useRouter();

    if (!isMounted) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!user?.isAuthenticated) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-4">
                <div className="h-20 w-20 bg-muted/50 rounded-full flex items-center justify-center">
                    <Lock className="h-10 w-10 text-muted-foreground" />
                </div>
                <div className="max-w-md space-y-2">
                    <h1 className="text-2xl font-bold">Access Restricted</h1>
                    <p className="text-muted-foreground">
                        Please connect your Stacks wallet to access this secured area of the application.
                    </p>
                </div>
                <Button size="lg" onClick={() => connectWallet()}>
                    Connect Wallet
                </Button>
            </div>
        );
    }

    return <>{children}</>;
}
