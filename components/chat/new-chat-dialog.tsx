"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/ui/dialog"
import { Button } from "@/ui/button"
import { Input } from "@/ui/input"
import { Label } from "@/ui/label"
import { Plus, Search, Loader2 } from "lucide-react"
import { useWallet } from "@/hooks/useWallet"
import { toast } from "@/hooks/use-toast"
import { Avatar, AvatarFallback, AvatarImage } from "@/ui/avatar"

// Types
interface UserResult {
    stxAddress: string
    btcName: string | null
}

export function NewChatDialog() {
    const router = useRouter()
    const { user } = useWallet()
    const [open, setOpen] = useState(false)
    const [query, setQuery] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [searchResults, setSearchResults] = useState<UserResult[]>([])
    const [selectedUser, setSelectedUser] = useState<UserResult | null>(null)

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!query.trim()) return

        setIsLoading(true)
        setSelectedUser(null)
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'}/api/chat/search?q=${encodeURIComponent(query)}`)
            if (!res.ok) throw new Error("Search failed")
            const data = await res.json()
            setSearchResults(data)

            // If no results but query looks like an address, allow selecting it directly?
            // For now, assume search must return something, or we can add a manual entry fallback.
            if (data.length === 0 && (query.startsWith('SP') || query.startsWith('ST'))) {
                // Manual fallback
                setSearchResults([{ stxAddress: query, btcName: null }])
            }
        } catch (error) {
            console.error(error)
            toast({
                title: "Error",
                description: "Failed to search users",
                variant: "destructive"
            })
        } finally {
            setIsLoading(false)
        }
    }

    const startChat = async () => {
        if (!selectedUser || !user?.address) return

        setIsLoading(true)
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'}/api/chat/request`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    initiator: user.address,
                    recipient: selectedUser.stxAddress
                })
            })

            if (!res.ok) throw new Error("Failed to start chat")

            const data = await res.json()
            setOpen(false)
            router.push(`/chat/${data.id}`)

            if (data.isNew) {
                toast({
                    title: "Request Sent",
                    description: `Chat request sent to ${selectedUser.btcName || selectedUser.stxAddress}`
                })
            }
        } catch (error) {
            console.error(error)
            toast({
                title: "Error",
                description: "Failed to start chat",
                variant: "destructive"
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full hover:bg-muted">
                    <Plus className="h-5 w-5" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>New Chat</DialogTitle>
                    <DialogDescription>
                        Search for a user by STX address or BNS name.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <form onSubmit={handleSearch} className="flex gap-2">
                        <Input
                            placeholder="Enter address or name..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                        <Button type="submit" disabled={isLoading} size="icon">
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                        </Button>
                    </form>

                    <div className="space-y-2 max-h-[200px] overflow-y-auto">
                        {searchResults.map((result) => (
                            <div
                                key={result.stxAddress}
                                className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-muted ${selectedUser?.stxAddress === result.stxAddress ? 'bg-muted ring-1 ring-primary' : ''}`}
                                onClick={() => setSelectedUser(result)}
                            >
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={`https://api.dicebear.com/9.x/adventurer/svg?seed=${result.stxAddress}`} />
                                    <AvatarFallback>{(result.btcName || result.stxAddress)[0].toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div className="overflow-hidden">
                                    <p className="font-medium text-sm truncate">{result.btcName || 'Unknown User'}</p>
                                    <p className="text-xs text-muted-foreground truncate">{result.stxAddress}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={startChat} disabled={!selectedUser || isLoading}>
                        Start Chat
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
