'use client';

import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';
import { env } from '@/lib/config';
import { useChatStore } from '@/store/useChatStore';
import type { Message } from '@/types/message';

type RealtimeMessage = Message & { conversationId: string };

interface RealtimeContextType {
    socket: Socket | null;
    sendMessage: (conversationId: string, message: Message) => void;
}

const RealtimeContext = createContext<RealtimeContextType>({
    socket: null,
    sendMessage: () => { },
});

export const useRealtimeContext = () => useContext(RealtimeContext);

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
    const socket = useMemo<Socket>(
        () => io(env.NEXT_PUBLIC_API_URL, { autoConnect: false, reconnection: true }),
        []
    );
    const { addMessage } = useChatStore();

    useEffect(() => {
        socket.on('connect', () => {
            console.log('Socket connected');
        });

        socket.on('new_message', (data: RealtimeMessage) => {
            if (data.conversationId) {
                addMessage(data.conversationId, data);
            }
        });

        socket.connect();

        return () => {
            socket.disconnect();
        };
    }, [addMessage, socket]);

    const sendMessage = (conversationId: string, message: Message) => {
        if (socket?.connected) {
            socket.emit('send_message', { ...message, conversationId });
        } else {
            console.warn('Socket disconnected, cannot send');
        }
    };

    return (
        <RealtimeContext.Provider value={{ socket, sendMessage }}>
            {children}
        </RealtimeContext.Provider>
    );
}
