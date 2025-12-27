'use client';

import { useState } from 'react';
import { Button } from '@/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/ui/card';
import { Loader2, Sparkles } from 'lucide-react';
import { mintAvatar } from '@/lib/contracts';
import { useWallet } from '@/hooks/useWallet';

export function AvatarMint() {
    const { user } = useWallet();
    const [isMinting, setIsMinting] = useState(false);

    const handleMint = async () => {
        if (!user?.isAuthenticated || !user.address) return;

        // Use user address as seed for consistency
        const seed = user.address;
        const uri = `https://api.dicebear.com/9.x/adventurer/svg?seed=${seed}`;

        setIsMinting(true);
        try {
            await mintAvatar(uri, 'testnet');
        } catch (e) {
            console.error(e);
        } finally {
            setIsMinting(false);
        }
    };

    return (
        <Card className="w-full max-w-sm mx-auto border-primary/20 bg-gradient-to-b from-background to-primary/5 p-1">
            <CardHeader className="text-center pb-2">
                <div className="mx-auto bg-primary/10 p-2.5 rounded-full w-fit mb-2 ring-1 ring-primary/20">
                    <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg">Mint Profile Avatar</CardTitle>
                <CardDescription className="text-xs">
                    Limited Edition Stacks Lab Avatars.
                    <br />
                    <span className="font-semibold text-primary mt-1 inline-block">Price: 100 STX</span>
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Button
                    className="w-full font-bold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]"
                    size="default"
                    onClick={handleMint}
                    disabled={isMinting || !user?.isAuthenticated}
                >
                    {isMinting ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Confirming...
                        </>
                    ) : (
                        'Mint Avatar'
                    )}
                </Button>
                {!user?.isAuthenticated && (
                    <p className="text-xs text-center mt-2 text-muted-foreground">
                        Connect wallet to mint
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
