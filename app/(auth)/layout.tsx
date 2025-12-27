'use client';

import { useWallet } from '@/hooks/useWallet';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, isMounted } = useWallet();
    const router = useRouter();

    useEffect(() => {
        if (isMounted && !user?.isAuthenticated) {
            router.push('/');
        }
    }, [user, isMounted, router]);

    if (!isMounted || !user?.isAuthenticated) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return <>{children}</>;
}
