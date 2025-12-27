import { ActiveChat } from '@/components/chat/active-chat';

interface ChatPageProps {
    params: Promise<{
        id: string
    }>
}

export default async function ConversationPage({ params }: ChatPageProps) {
    const { id } = await params;

    return <ActiveChat conversationId={id} />;
}
