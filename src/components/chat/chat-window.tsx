import { useState, useRef, useEffect } from "react"
import { SendIcon, BotIcon, UserIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

export type Message = {
  id: string
  role: "user" | "supervisor"
  content: string
  timestamp: Date
}

type ChatWindowProps = {
  messages?: Message[]
  onSendMessage?: (text: string) => void
}

export function ChatWindow({
  messages = [],
  onSendMessage,
}: ChatWindowProps) {
  const [inputValue, setInputValue] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim()) return

    const newMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue,
      timestamp: new Date(),
    }

    onSendMessage?.(inputValue)
    setInputValue("")
  }

  return (
    <div className="flex flex-1 flex-col min-h-0 overflow-hidden bg-background">
      {/* Header */}
      <div className="flex h-14 items-center border-b border-border/40 px-6 shrink-0">
        <h2 className="text-lg font-semibold tracking-tight">Supervisor</h2>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-6 min-h-0" viewportRef={scrollRef}>
        <div className="flex flex-col gap-6">
          {messages.length === 0 ? (
            <div className="flex h-full flex-1 flex-col items-center justify-center space-y-4 text-center">
              <div className="rounded-full bg-muted p-4">
                <BotIcon className="size-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-medium">No messages yet</h3>
                <p className="text-sm text-muted-foreground">
                  Send a message to start interacting with the supervisor agent.
                </p>
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex w-full max-w-2xl gap-4",
                  msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                )}
              >
                <Avatar className="size-8 shrink-0">
                  <AvatarFallback className={cn(
                    msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-accent"
                  )}>
                    {msg.role === "user" ? <UserIcon className="size-4" /> : <BotIcon className="size-4" />}
                  </AvatarFallback>
                </Avatar>
                <div
                  className={cn(
                    "rounded-xl px-4 py-3 text-sm",
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  )}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-border/40 shrink-0">
        <form
          onSubmit={handleSubmit}
          className="mx-auto flex max-w-3xl items-center gap-2 rounded-xl border border-input bg-transparent px-3 py-1.5 focus-within:ring-1 focus-within:ring-ring"
        >
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Send a message to the supervisor..."
            className="border-0 shadow-none focus-visible:ring-0 px-0 h-10"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!inputValue.trim()}
            className="size-8 shrink-0 rounded-lg"
          >
            <SendIcon className="size-4" />
            <span className="sr-only">Send message</span>
          </Button>
        </form>
      </div>
    </div>
  )
}
