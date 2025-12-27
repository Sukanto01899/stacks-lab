import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ChatConversation, Message } from '@/types/message';

interface ChatState {
    conversations: ChatConversation[];
    activeConversationId: string | null;
    messages: Record<string, Message[]>; // Map conversationId to messages
    isLoading: boolean;

    setActiveConversation: (id: string | null) => void;
    addMessage: (conversationId: string, message: Message) => void;
    setMessages: (conversationId: string, messages: Message[]) => void;
    addConversation: (conversation: ChatConversation) => void;
}

export const useChatStore = create<ChatState>()(
    persist(
        (set) => ({
            conversations: [],
            activeConversationId: null,
            messages: {},
            isLoading: false,

            setActiveConversation: (id) => set({ activeConversationId: id }),

            addMessage: (conversationId, message) => set((state) => {
                const currentMessages = state.messages[conversationId] || [];
                return {
                    messages: {
                        ...state.messages,
                        [conversationId]: [...currentMessages, message]
                    }
                };
            }),

            setMessages: (conversationId, messages) => set((state) => ({
                messages: {
                    ...state.messages,
                    [conversationId]: messages
                }
            })),

            addConversation: (conversation) => set((state) => ({
                conversations: [...state.conversations, conversation]
            })),
        }),
        {
            name: 'stackshub-chat-storage',
        }
    )
);
