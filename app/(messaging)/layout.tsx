'use client';

import { useWallet } from '@/hooks/useWallet';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { ChatSidebar } from '@/components/chat/chat-sidebar';

export default function MessagingLayout({
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

    return (
        <div className="flex h-[calc(100vh-4rem)]">
            <div className="w-80 border-r hidden md:block">
                <ChatSidebar />
            </div>
            <main className="flex-1 flex flex-col min-w-0">
                {children}
            </main>
        </div>
    );
}
