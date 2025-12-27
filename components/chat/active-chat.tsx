'use client';

import { useEffect, useState, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/ui/avatar";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { MoreVertical, Phone, Send, Video, Paperclip, Smile, Lock, Unlock, Key } from "lucide-react";
import { useChatStore } from '@/store/useChatStore';
import { useRealtime } from '@/hooks/useRealtime';
import { useWallet } from '@/hooks/useWallet';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';
import { encryptMessage, decryptMessage, getPublicKeyFromPrivate } from '@/lib/encryption';
import { getUserSession } from '@/lib/stacks-client';
import { Message } from '@/types/message';
import { UserSession } from '@stacks/connect';
import { env } from '@/lib/config';

interface ActiveChatProps {
    conversationId: string;
}

const HANDSHAKE_PREFIX = '::HANDSHAKE::';

// Component to handle decryption of individual messages
function MessageBubble({ msg, userSession, isMe }: { msg: Message, userSession: UserSession | null, isMe: boolean }) {
    const [decryptedContent, setDecryptedContent] = useState<string | null>(null);
    const [isDecrypting, setIsDecrypting] = useState(false);

    useEffect(() => {
        let mounted = true;
        const decrypt = async () => {
            if (msg.isEncrypted && userSession && !isMe) {
                // If I sent it, I should have stored the plaintext? 
                // Or I double-encrypted? For now, assume I can't read my own sent encrypted messages unless I stored them.
                // But the store has them. Wait, if I refresh, the store persists the *original* plaintext for me? 
                // No, the store persists what was added.
                // When we SEND, we add plaintext to store, but emit ENCRYPTED.
                // So for "Me", we always have plaintext.
                // For "Them", we receive encrypted.
                setIsDecrypting(true);
                const decrypted = await decryptMessage(msg.content, userSession);
                if (mounted) {
                    setDecryptedContent(decrypted);
                    setIsDecrypting(false);
                }
            }
        };

        if (msg.isEncrypted && !isMe) {
            decrypt();
        } else {
            setDecryptedContent(msg.content);
        }

        return () => { mounted = false; };
    }, [msg, userSession, isMe]);

    const displayContent = isMe ? msg.content : (msg.isEncrypted ? (decryptedContent || "🔒 Decrypting...") : msg.content);
    const isLocked = msg.isEncrypted;

    return (
        <div className={`max-w-[75%] rounded-2xl px-5 py-3 shadow-sm relative group ${isMe
            ? 'bg-gradient-to-br from-orange-500 to-amber-600 text-white rounded-br-sm shadow-orange-500/20'
            : 'glass-card rounded-bl-sm'
            }`}>
            <p className="text-sm leading-relaxed flex items-center gap-2">
                {isLocked && <Lock className="h-3 w-3 opacity-70" />}
                {displayContent}
            </p>
            <p className={`text-[10px] mt-1.5 text-right ${isMe ? 'text-white/70' : 'text-muted-foreground'}`}>
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
        </div>
    );
}

export function ActiveChat({ conversationId }: ActiveChatProps) {
    const { messages, addMessage } = useChatStore();
    const { user } = useWallet();
    const [inputValue, setInputValue] = useState('');
    const virtuosoRef = useRef<VirtuosoHandle>(null);
    const [recipientPublicKey, setRecipientPublicKey] = useState<string | null>(null);
    const [myPublicKey, setMyPublicKey] = useState<string | null>(null);

    const { sendMessage, socket } = useRealtime(conversationId);
    const userSession = getUserSession();

    const currentMessages = messages[conversationId] || [];
    const [conversationDetails, setConversationDetails] = useState<any>(null);

    // Fetch Details and History
    useEffect(() => {
        if (!conversationId || !user?.address) return;

        const fetchData = async () => {
            try {
                // Fetch Details
                const resDetails = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'}/api/chat/${conversationId}/details`);
                if (resDetails.ok) {
                    setConversationDetails(await resDetails.json());
                }

                // Fetch History
                const resHistory = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'}/api/chat/${conversationId}/messages`);
                if (resHistory.ok) {
                    const history = await resHistory.json();
                    // Populate store (avoid duplicates?)
                    // For now we just iterate and add if not exists, or verify implementation of addMessage
                    history.forEach((m: any) => {
                        addMessage(conversationId, {
                            id: m.id,
                            senderAddress: m.senderAddress,
                            recipientAddress: conversationId, // Group ID
                            content: m.content,
                            timestamp: new Date(m.createdAt).getTime(),
                            isEncrypted: m.isEncrypted,
                            status: 'sent'
                        });
                    });
                }
            } catch (e) {
                console.error(e);
            }
        };
        fetchData();
    }, [conversationId, user?.address, addMessage]);

    const acceptChat = async () => {
        try {
            await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'}/api/chat/${conversationId}/accept`, { method: 'POST' });
            setConversationDetails({ ...conversationDetails, status: 'ACTIVE' });
        } catch (e) {
            console.error(e);
        }
    }

    // Derive My Public Key on Mount
    useEffect(() => {
        if (userSession.isUserSignedIn()) {
            const userData = userSession.loadUserData();
            const appPrivateKey = userData.appPrivateKey;
            if (appPrivateKey) {
                const pubKey = getPublicKeyFromPrivate(appPrivateKey);
                setMyPublicKey(pubKey);
            }
        }
    }, []);

    const otherMember = conversationDetails?.participants?.find((p: any) => p.address !== user?.address);
    const displayName = otherMember?.name || otherMember?.address || conversationId;

    // Handshake: Emit Key on Join
    useEffect(() => {
        if (socket?.connected && myPublicKey && conversationId) {
            // Send Handshake
            const handshake = JSON.stringify({
                type: 'HANDSHAKE',
                publicKey: myPublicKey
            });
            // We send this as a "message" but prefix it so UI knows to hide it
            sendMessage(conversationId, {
                id: Date.now().toString(),
                senderAddress: user?.address || '',
                recipientAddress: conversationId,
                content: HANDSHAKE_PREFIX + handshake,
                timestamp: Date.now(),
                isEncrypted: false,
                status: 'sent'
            });
        }
    }, [socket?.connected, myPublicKey, conversationId]);

    // Listen for Handshakes in Message Stream
    useEffect(() => {
        // Scan existing messages for handshake from the OTHER person
        // In a real app, we'd use a dedicated 'handshake' event or a presence system.
        // Here we tunnel through messages.
        const otherMessages = currentMessages.filter(m => m.senderAddress === conversationId || m.senderAddress !== user?.address);
        for (const m of otherMessages) {
            if (m.content.startsWith(HANDSHAKE_PREFIX)) {
                try {
                    const payload = JSON.parse(m.content.substring(HANDSHAKE_PREFIX.length));
                    if (payload.type === 'HANDSHAKE' && payload.publicKey) {
                        setRecipientPublicKey(payload.publicKey);
                        // Once found, we break (assuming latest key is what we want, or first found)
                        // Actually, if they rotate keys, we want latest. But for now, first valid is fine.
                        break;
                    }
                } catch (e) { }
            }
        }
    }, [currentMessages, conversationId, user?.address]);

    // Auto-scroll
    useEffect(() => {
        if (virtuosoRef.current) {
            virtuosoRef.current.scrollToIndex({
                index: currentMessages.length - 1,
                align: 'end',
                behavior: 'smooth'
            });
        }
    }, [currentMessages.length]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim() || !user) return;

        let contentToSend = inputValue;
        let isEncrypted = false;

        // E2EE Logic
        if (recipientPublicKey) {
            try {
                const encrypted = await encryptMessage(inputValue, recipientPublicKey);
                contentToSend = encrypted;
                isEncrypted = true;
            } catch (error) {
                console.error("Encryption failed, sending plaintext", error);
            }
        }

        const newMessage: Message = {
            id: Date.now().toString(),
            senderAddress: user.address || '',
            recipientAddress: conversationId,
            content: contentToSend,
            timestamp: Date.now(),
            isEncrypted: isEncrypted,
            status: 'sent'
        };

        // Optimistic UI: Add PLAINTEXT to our own store so we can read it
        const optimisticMessage: Message = {
            ...newMessage,
            content: inputValue, // Store plaintext for myself
            isEncrypted: isEncrypted // Maintain flag so we show Lock icon
        };

        addMessage(conversationId, optimisticMessage);

        // Send ENCRYPTED over the wire
        sendMessage(conversationId, newMessage);
        setInputValue('');
    };

    // Filter out Handshake messages from UI
    const visibleMessages = currentMessages.filter(m => !m.content.startsWith(HANDSHAKE_PREFIX));

    return (
        <div className="flex flex-col h-full bg-background relative overflow-hidden">
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-background to-background"></div>

            {/* Chat Header */}
            <header className="flex items-center justify-between p-4 border-b border-white/5 bg-background/60 backdrop-blur-xl sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border border-white/10 shadow-sm">
                        <AvatarImage src={`https://api.dicebear.com/9.x/adventurer/svg?seed=${displayName}`} />
                        <AvatarFallback>{displayName[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                        <h3 className="font-semibold text-sm flex items-center gap-2">
                            {displayName}
                            {recipientPublicKey ? (
                                <span title="End-to-End Encrypted" className="text-green-500"><Lock className="h-3 w-3" /></span>
                            ) : (
                                <span title="Not Encrypted" className="text-amber-500"><Unlock className="h-3 w-3" /></span>
                            )}
                        </h3>
                        <div className="flex items-center gap-1.5">
                            <span className="relative flex h-2 w-2">
                                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${conversationDetails?.status === 'REQUESTED' ? 'bg-amber-400' : 'bg-green-400'}`}></span>
                                <span className={`relative inline-flex rounded-full h-2 w-2 ${conversationDetails?.status === 'REQUESTED' ? 'bg-amber-500' : 'bg-green-500'}`}></span>
                            </span>
                            <p className="text-xs text-muted-foreground">{conversationDetails?.status === 'REQUESTED' ? 'Request Pending' : 'Online'}</p>
                        </div>
                    </div>
                </div>

                {conversationDetails?.status === 'REQUESTED' && (
                    <Button size="sm" onClick={acceptChat} className="bg-primary hover:bg-primary/90 text-white ml-auto mr-4">
                        Accept Request
                    </Button>
                )}

                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:text-primary">
                        <Phone className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:text-primary">
                        <Video className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:text-primary">
                        <MoreVertical className="h-5 w-5" />
                    </Button>
                </div>
            </header>

            {/* Messages (Virtual List) */}
            <div className="flex-1 p-4 md:p-6 min-h-0">
                {visibleMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-4 animate-in fade-in zoom-in duration-500">
                        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                            <Smile className="h-8 w-8 text-primary/50" />
                        </div>
                        <div className="space-y-1">
                            <p className="font-medium">No messages yet</p>
                            <p className="text-sm text-muted-foreground">Start the conversation with a wave! 👋</p>
                            {!recipientPublicKey && (
                                <p className="text-xs text-amber-500 flex items-center justify-center gap-1">
                                    <Key className="h-3 w-3" /> Waiting for secure key exchange...
                                </p>
                            )}
                        </div>
                    </div>
                ) : (
                    <Virtuoso
                        ref={virtuosoRef}
                        style={{ height: '100%' }}
                        data={visibleMessages}
                        followOutput
                        initialTopMostItemIndex={visibleMessages.length - 1}
                        itemContent={(index, msg) => {
                            const isMe = msg.senderAddress === user?.address;
                            return (
                                <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} pb-6 px-1`}>
                                    <MessageBubble msg={msg} userSession={userSession} isMe={isMe} />
                                </div>
                            );
                        }}
                    />
                )}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-transparent">
                <div className="max-w-3xl mx-auto">
                    <form onSubmit={handleSendMessage} className="flex gap-2 items-end glass-card p-2 rounded-2xl focus-within:ring-1 focus-within:ring-primary/50 transition-all shadow-lg">
                        <Button type="button" size="icon" variant="ghost" className="text-muted-foreground hover:text-primary h-10 w-10 shrink-0 rounded-xl">
                            <Paperclip className="h-5 w-5" />
                        </Button>
                        <Input
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder={recipientPublicKey ? "Type a secure message..." : "Type a message (unencrypted)..."}
                            className="flex-1 border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-2 min-h-[40px] placeholder:text-muted-foreground/50"
                        />
                        <div className="flex gap-1">
                            <Button type="button" size="icon" variant="ghost" className="text-muted-foreground hover:text-primary h-10 w-10 shrink-0 rounded-xl">
                                <Smile className="h-5 w-5" />
                            </Button>
                            <Button type="submit" size="icon" className={`h-10 w-10 shrink-0 rounded-xl shadow-md text-white ${recipientPublicKey ? 'bg-green-600 hover:bg-green-700' : 'bg-primary hover:bg-primary/90'}`} disabled={!inputValue.trim()}>
                                {recipientPublicKey ? <Lock className="h-4 w-4" /> : <Send className="h-4 w-4" />}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
