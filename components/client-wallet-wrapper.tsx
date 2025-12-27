'use client';

import dynamic from 'next/dynamic';
import { Button } from '@/ui/button';
import { Loader2 } from 'lucide-react';

const ConnectWalletButton = dynamic(
    () => import('./connect-wallet-button').then((mod) => mod.ConnectWalletButton),
    {
        ssr: false,
        loading: () => (
            <Button disabled variant="outline">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
            </Button>
        )
    }
);

export function ClientWalletWrapper() {
    return <ConnectWalletButton />;
}
