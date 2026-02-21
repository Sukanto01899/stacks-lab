'use client';

import { useState } from 'react';
import { Button } from '@/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/ui/card';
import { Loader2, Sparkles, Eye } from 'lucide-react';
import { mintAvatar } from '@/lib/contracts';
import { env } from '@/lib/config';
import { useWallet } from '@/hooks/useWallet';
import { Avatar, AvatarImage, AvatarFallback } from '@/ui/avatar';

export function AvatarMint() {
    const { user } = useWallet();
    const [isMinting, setIsMinting] = useState(false);
    const [showPreview, setShowPreview] = useState(false);

    // Generate avatar preview URL
    const previewUrl = user?.address 
        ? `https://api.dicebear.com/9.x/adventurer/svg?seed=${user.address}`
        : '';

    const handleMint = async () => {
        if (!user?.isAuthenticated || !user.address) return;

        const seed = user.address;
        const uri = `https://api.dicebear.com/9.x/adventurer/svg?seed=${seed}`;

        setIsMinting(true);
        try {
            const networkType = env.NEXT_PUBLIC_STACKS_NETWORK === 'mainnet' ? 'mainnet' : 'testnet';
            await mintAvatar(uri, networkType);
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
            
            {/* Avatar Preview Section */}
            {user?.isAuthenticated && (
                <div className="px-6 py-2">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
                        <Avatar className="h-12 w-12 ring-2 ring-primary/20">
                            <AvatarImage src={previewUrl} />
                            <AvatarFallback>?</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <p className="text-xs font-medium">Your Avatar Preview</p>
                            <p className="text-[10px] text-muted-foreground truncate max-w-[150px]">
                                {user.address?.slice(0, 10)}...{user.address?.slice(-4)}
                            </p>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => window.open(previewUrl, '_blank')}
                        >
                            <Eye className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}

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
