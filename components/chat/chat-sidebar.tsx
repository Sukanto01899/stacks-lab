"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/ui/avatar";
import { Input } from "@/ui/input";
import { ScrollArea } from "@/ui/scroll-area";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWallet } from "@/hooks/useWallet";
import { NewChatDialog } from "./new-chat-dialog";

export function ChatSidebar() {
  const pathname = usePathname();
  const { user } = useWallet();
  const [conversations, setConversations] = useState<any[]>([]);
  const [view, setView] = useState<"active" | "requests">("active");

  // Polling for conversations
  useEffect(() => {
    if (!user?.address) return;

    const fetchConversations = async () => {
      try {
        const res = await fetch(
          `${
            process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001"
          }/api/chat/conversations?user=${user.address}`,
        );
        if (res.ok) {
          const data = await res.json();
          setConversations(data);
        }
      } catch (error) {
        console.error("Failed to fetch conversations", error);
      }
    };

    fetchConversations();
    const interval = setInterval(fetchConversations, 5000); // Poll every 5s
    return () => clearInterval(interval);
  }, [user?.address]);

  const filteredConversations = conversations.filter((c) => {
    if (view === "requests") return c.status === "REQUESTED";
    return c.status === "ACTIVE";
  });

  return (
    <div className="w-full md:w-80 border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex flex-col h-[calc(100vh-4rem)]">
      <div className="p-4 border-b space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-lg tracking-tight">Messages</h2>
          <NewChatDialog />
        </div>

        <div className="flex gap-2 p-1 bg-muted/50 rounded-lg">
          <button
            onClick={() => setView("active")}
            className={cn(
              "flex-1 text-xs font-medium py-1.5 rounded-md transition-all",
              view === "active"
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Active
          </button>
          <button
            onClick={() => setView("requests")}
            className={cn(
              "flex-1 text-xs font-medium py-1.5 rounded-md transition-all",
              view === "requests"
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Requests
            {conversations.filter((c) => c.status === "REQUESTED").length >
              0 && (
              <span className="ml-1.5 text-[9px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">
                {conversations.filter((c) => c.status === "REQUESTED").length}
              </span>
            )}
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search messages..."
            className="pl-9 bg-muted/50 border-none focus-visible:ring-1 focus-visible:ring-primary/20"
          />
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-2 p-3">
          {filteredConversations.length === 0 && (
            <div className="text-center text-sm text-muted-foreground py-8">
              {view === "active"
                ? "No active conversations"
                : "No new requests"}
            </div>
          )}
          {filteredConversations.map((chat) => {
            const isActive = pathname === `/chat/${chat.id}`;
            const otherUser = chat.otherUser || {};
            const displayName =
              otherUser.name || otherUser.address || "Unknown";

            return (
              <Link
                key={chat.id}
                href={`/chat/${chat.id}`}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-xl transition-all duration-200",
                  isActive
                    ? "bg-primary/10 hover:bg-primary/15"
                    : "hover:bg-muted/50",
                )}
              >
                <Avatar className="border-2 border-background shadow-sm">
                  <AvatarImage
                    src={`https://api.dicebear.com/9.x/adventurer/svg?seed=${otherUser.address}`}
                  />
                  <AvatarFallback>
                    {displayName[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 overflow-hidden min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span
                      className={cn(
                        "font-medium truncate text-sm",
                        isActive ? "text-foreground" : "text-foreground/90",
                      )}
                    >
                      {displayName}
                    </span>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2">
                      {chat.updatedAt
                        ? new Date(chat.updatedAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : ""}
                    </span>
                  </div>
                  <p
                    className={cn(
                      "text-xs truncate",
                      isActive ? "text-foreground/80" : "text-muted-foreground",
                    )}
                  >
                    {chat.lastMessage
                      ? chat.lastMessage.content
                      : view === "requests"
                        ? "New chat request"
                        : "No messages yet"}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
