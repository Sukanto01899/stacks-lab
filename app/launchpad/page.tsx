'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

const ClientLaunchpad = dynamic(
    () => import('@/components/client-launchpad'),
    {
        ssr: false,
        loading: () => (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }
);

import { AuthGuard } from '@/components/auth-guard';

export default function LaunchpadPage() {
    return (
        <AuthGuard>
            <ClientLaunchpad />
        </AuthGuard>
    );
}
