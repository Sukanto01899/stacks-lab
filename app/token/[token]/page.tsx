'use client';

import { useParams } from 'next/navigation';
import { AuthGuard } from '@/components/auth-guard';
import { TokenTradingInterface } from '@/components/launchpad/token-trading-interface';

export default function TokenPage() {
    // [token] param will be the full principal string
    const params = useParams();
    const tokenPrincipal = params.token as string;

    return (
        <AuthGuard>
            <div className="container py-8">
                <TokenTradingInterface tokenPrincipal={tokenPrincipal} />
            </div>
        </AuthGuard>
    );
}
