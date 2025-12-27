import { MessageSquare } from "lucide-react"

export default function ChatPage() {
    return (
        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8 text-center">
            <div className="bg-muted/50 p-6 rounded-full mb-4">
                <MessageSquare className="h-12 w-12" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Select a conversation</h3>
            <p className="max-w-sm">
                Choose a conversation from the sidebar or start a new one to begin chatting securely on Stacks.
            </p>
        </div>
    )
}
