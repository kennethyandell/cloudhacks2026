import { useState, useRef, useEffect } from "react"
import ReactMarkdown from "react-markdown"
import { SendIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { SectionHeader, BootLine } from "@/components/magi/terminal"
import { DEFAULT_AGENT_NAMES, type AgentNames } from "@/utils/use-agent-names"
import { cn } from "@/lib/utils"

/**
 * Mistral models sometimes wrap supervisor responses in a JSON tool-call
 * structure like:
 *   [{"name":"AgentCommunication.__sendMessage","arguments":{"recipient":"User","content":"..."}}]
 * This helper extracts the actual text. Falls back to the original string
 * if parsing fails or the shape is unexpected.
 */
function parseMessageContent(raw: string): string {
  try {
    // The model streams literal newline/tab/CR characters inside JSON string
    // values. JSON.parse rejects those, so escape them first.
    const sanitized = raw
      .replace(/\\/g, '\\\\')   // escape existing backslashes first
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t')
    const parsed = JSON.parse(sanitized)

    // Pattern 1: Array of tool-call objects
    if (Array.isArray(parsed)) {
      const texts = parsed
        .map((item: any) => item?.arguments?.content ?? item?.content)
        .filter(Boolean)
      if (texts.length > 0) return texts.join("\n\n")
    }

    // Pattern 2: Single tool-call object
    if (parsed?.arguments?.content) return parsed.arguments.content
    if (typeof parsed?.content === "string") return parsed.content
  } catch {
    // Not JSON — return as-is
  }
  return raw
}

export type Message = {
  id: string
  role: "user" | "supervisor"
  content: string
  timestamp: Date
}

type ChatWindowProps = {
  messages?: Message[]
  onSendMessage?: (text: string) => void
  agentNames?: AgentNames
}

export function ChatWindow({
  messages = [],
  onSendMessage,
  agentNames = DEFAULT_AGENT_NAMES,
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

    onSendMessage?.(inputValue)
    setInputValue("")
  }

  return (
    <div className="flex flex-1 flex-col min-h-0 overflow-hidden bg-background">
      {/* Header */}
      <div className="flex h-14 items-center border-b border-border px-6 shrink-0">
        <SectionHeader>Supervisor</SectionHeader>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-6 min-h-0" viewportRef={scrollRef}>
        <div className="flex flex-col gap-6">
          {messages.length === 0 ? (
            <div className="flex h-full flex-1 flex-col items-center justify-center">
              <div className="w-full max-w-sm space-y-1">
                <BootLine label="INIT MAGI.SYS" />
                <BootLine label={`LINK ${agentNames.melchior.toUpperCase()}-1`} />
                <BootLine label={`LINK ${agentNames.balthasar.toUpperCase()}-2`} />
                <BootLine label={`LINK ${agentNames.casper.toUpperCase()}-3`} />
                <div className="flex items-baseline gap-2 pt-1 text-[13px] leading-6 text-muted-foreground">
                  <span>&gt;</span>
                  <span className="uppercase tracking-[0.12em]">
                    AWAITING OPERATOR INPUT
                  </span>
                  <span
                    aria-hidden
                    className="ml-1 inline-block animate-pulse text-primary"
                  >
                    &#9612;
                  </span>
                </div>
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
                <Avatar className="size-8 shrink-0 rounded-none">
                  <AvatarFallback
                    className={cn(
                      "rounded-none border text-[10px] font-mono tracking-[0.18em] uppercase",
                      msg.role === "user"
                        ? "border-primary/60 bg-primary/10 text-primary"
                        : "border-border bg-muted text-muted-foreground"
                    )}
                  >
                    {msg.role === "user" ? "[U]" : "[S]"}
                  </AvatarFallback>
                </Avatar>
                <div
                  className={cn(
                    "border px-4 py-3 text-sm",
                    msg.role === "user"
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "border-border bg-muted/30 text-foreground space-y-3 [&_p:not(:last-child)]:mb-3 [&_code]:bg-background/60 [&_code]:border [&_code]:border-border [&_code]:px-1.5 [&_code]:py-0.5 [&_pre]:border [&_pre]:border-border [&_pre]:bg-background/60 [&_pre]:p-4 [&_pre_code]:bg-transparent [&_pre_code]:border-0 [&_pre_code]:p-0 break-words [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mt-1 [&_strong]:font-semibold"
                  )}
                >
                  {msg.role === "supervisor" ? (
                    <ReactMarkdown>
                      {parseMessageContent(msg.content)}
                    </ReactMarkdown>
                  ) : (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-border shrink-0">
        <div className="mx-auto mb-2 flex max-w-3xl items-center gap-2 text-[10px] uppercase tracking-[0.2em]">
          <span className="text-primary">&gt;</span>
          {inputValue.trim().length === 0 ? (
            <span className="text-muted-foreground">
              Type in your response.
            </span>
          ) : (
            <span className="text-primary">
              Drafting transmission &mdash; {inputValue.trim().length} chars &middot; press enter to send
            </span>
          )}
        </div>
        <form
          onSubmit={handleSubmit}
          className="mx-auto flex max-w-3xl items-center gap-2 border border-border bg-transparent px-3 py-1.5 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/40"
        >
          <span
            aria-hidden
            className="select-none text-primary text-sm tracking-[0.2em]"
          >
            &gt;
          </span>
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="send a message to the supervisor..."
            className="border-0 shadow-none focus-visible:ring-0 px-0 h-10 font-mono text-[13px] placeholder:uppercase placeholder:tracking-[0.12em] placeholder:text-muted-foreground"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!inputValue.trim()}
            className="size-8 shrink-0 rounded-none"
          >
            <SendIcon className="size-4" />
            <span className="sr-only">Send message</span>
          </Button>
        </form>
      </div>
    </div>
  )
}
