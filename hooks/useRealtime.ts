'use client';

import { useEffect } from 'react';
import { useRealtimeContext } from '@/components/providers/realtime-provider';

export function useRealtime(conversationId?: string) {
    const { socket, sendMessage } = useRealtimeContext();

    useEffect(() => {
        if (!socket || !conversationId) return;

        if (socket.connected) {
            socket.emit('join_chat', conversationId);
        } else {
            const onConnect = () => {
                socket.emit('join_chat', conversationId);
            };
            socket.on('connect', onConnect);
            return () => {
                socket.off('connect', onConnect);
            };
        }

    }, [conversationId, socket]);

    return { sendMessage, socket };
}
