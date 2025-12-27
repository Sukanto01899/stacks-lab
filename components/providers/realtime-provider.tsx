'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { env } from '@/lib/config';
import { useChatStore } from '@/store/useChatStore';

interface RealtimeContextType {
    socket: Socket | null;
    sendMessage: (conversationId: string, message: any) => void;
}

const RealtimeContext = createContext<RealtimeContextType>({
    socket: null,
    sendMessage: () => { },
});

export const useRealtimeContext = () => useContext(RealtimeContext);

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
    const [socket, setSocket] = useState<Socket | null>(null);
    const { addMessage } = useChatStore();

    useEffect(() => {
        // Initialize socket
        const newSocket = io(env.NEXT_PUBLIC_API_URL, {
            autoConnect: false, // We connect manually or when authenticated ideally
            reconnection: true,
        });

        newSocket.on('connect', () => {
            console.log('Socket connected');
        });

        newSocket.on('new_message', (data: any) => {
            if (data.conversationId) {
                addMessage(data.conversationId, data);
            }
        });

        newSocket.connect();
        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, [addMessage]);

    const sendMessage = (conversationId: string, message: any) => {
        if (socket && socket.connected) {
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
