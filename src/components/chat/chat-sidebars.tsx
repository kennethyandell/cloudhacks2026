import { useEffect, useState, useRef, type ReactNode } from "react"
import ReactMarkdown from "react-markdown"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { FlowCanvas, type FlowNodeId } from "@/components/configure/flow-canvas"
import { SectionHeader } from "@/components/magi/terminal"
import { PlusIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { api } from "@/utils/api"
import type { Message } from "@/components/chat/chat-window"

type ChatSidebarProps = {
  title?: string
  children?: ReactNode
  className?: string
}

type ChatLeftSidebarProps = ChatSidebarProps & {
  activeChatId?: string
  onSelectChat?: (id: string, messages?: Message[]) => void
  onNewChat?: () => void
  refreshKey?: number
}

export function ChatLeftSidebar({ 
  title = "Previous Chats",
  activeChatId = "new",
  onSelectChat,
  onNewChat,
  refreshKey = 0,
}: ChatLeftSidebarProps) {
  const [previousChats, setPreviousChats] = useState<{ id: string, title: string, date: string, messages?: Message[] }[]>([])

  useEffect(() => {
    api.chats.list("default-user").then((items: any[]) => {
      const formatted = items.map(item => {
        const d = new Date(item.createdAt)
        const dateStr = d.toLocaleDateString()
        return {
          id: item.chatID,
          title: item.title || "Chat",
          date: dateStr,
          messages: item.messages || []
        }
      })
      setPreviousChats(formatted)
    }).catch(err => console.error("Failed to load chats", err))
  }, [refreshKey])

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-border bg-sidebar min-h-0">
      <div className="flex h-14 shrink-0 items-center justify-between px-4 border-b border-border">
        <SectionHeader>{title}</SectionHeader>
        <Button
          size="icon"
          variant="ghost"
          className="size-7 rounded-none text-muted-foreground hover:text-primary"
          onClick={onNewChat}
          title="New Chat"
        >
          <PlusIcon className="size-4" />
        </Button>
      </div>
      <ScrollArea className="flex-1 min-h-0">
        <div className="flex flex-col p-2">
          {previousChats.map((chat) => {
            const isActive = activeChatId === chat.id
            return (
              <button
                key={chat.id}
                type="button"
                onClick={() => onSelectChat?.(chat.id, chat.messages)}
                className={cn(
                  "group relative flex items-center gap-2 border-l-2 px-3 py-2 text-left text-[12px] transition-colors",
                  isActive
                    ? "border-primary bg-accent text-primary"
                    : "border-transparent text-foreground hover:bg-muted/40 hover:text-primary"
                )}
              >
                <span
                  className={cn(
                    "shrink-0 tracking-[0.2em]",
                    isActive ? "text-primary" : "text-muted-foreground group-hover:text-primary"
                  )}
                >
                  &gt;
                </span>
                <span className="flex-1 min-w-0 overflow-hidden">
                  <span className="block truncate uppercase tracking-[0.08em]">
                    {chat.title}
                  </span>
                  <span className="block text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    {chat.date}
                  </span>
                </span>
              </button>
            )
          })}
        </div>
      </ScrollArea>
    </aside>
  )
}

export type AgentThought = {
  id: string
  agent: string
  nodeId: FlowNodeId
  message: string
  timestamp: Date
}

type ChatRightSidebarProps = ChatSidebarProps & {
  activeNode?: FlowNodeId | null
  thoughts?: AgentThought[]
}

const AGENT_DOT_STYLE: Record<FlowNodeId, React.CSSProperties> = {
  "top": { backgroundColor: "var(--agent-melchior)" },
  "bottom-left": { backgroundColor: "var(--agent-balthasar)" },
  "bottom-right": { backgroundColor: "var(--agent-casper)" },
}

export function ChatRightSidebar({
  title = "Agent Activity",
  activeNode,
  thoughts = [],
}: ChatRightSidebarProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [thoughts])

  const truncateMessage = (msg: string, wordCount: number) => {
    const words = msg.split(/\s+/)
    if (words.length <= wordCount) return msg
    return words.slice(0, wordCount).join(' ') + '...'
  }

  return (
    <aside className="flex w-80 shrink-0 flex-col border-l border-border bg-sidebar min-h-0">
      <div className="flex h-14 shrink-0 items-center px-4 border-b border-border">
        <SectionHeader>{title}</SectionHeader>
      </div>
      
      {/* Miniature Graph Top Section */}
      <div className="h-48 shrink-0 border-b border-border bg-background/50 relative">
        <div className="absolute top-2 left-3 text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
          &gt; Architecture
        </div>
        <FlowCanvas mini activeNode={activeNode} />
      </div>

      {/* Agents' Thoughts Bottom Section */}
      <div className="flex h-10 shrink-0 items-center px-4 border-b border-border bg-muted/20">
        <SectionHeader className="text-[11px] tracking-[0.22em]">
          Subagent Thoughts Stream
        </SectionHeader>
      </div>
      <ScrollArea className="flex-1 min-h-0">
        <div className="flex flex-col gap-4 p-4">
          {thoughts.length === 0 ? (
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground text-center mt-4">
              &gt; waiting for subagent activity...
            </p>
          ) : (
            <>
              {thoughts.map((thought) => (
                <div key={thought.id} className="flex flex-col gap-1.5 text-sm">
                  <div className="flex items-center gap-2">
                    <span
                      className="size-2 shrink-0 rounded-full"
                      style={AGENT_DOT_STYLE[thought.nodeId]}
                    />
                    <span className="font-semibold uppercase tracking-[0.12em] text-foreground text-[12px]">
                      {thought.agent}
                    </span>
                    <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground ml-auto tabular-nums">
                      {thought.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                  <div className="border border-border/60 bg-muted/10 p-2.5 text-muted-foreground text-[13px] space-y-2 [&>p]:mb-0 [&_p:last-child]:mb-0 [&_code]:bg-background/60 [&_code]:border [&_code]:border-border [&_code]:px-1 [&_code]:py-0.5 [&_pre]:bg-background/60 [&_pre]:border [&_pre]:border-border [&_pre]:p-2 break-words">
                    <ReactMarkdown>
                      {truncateMessage(thought.message, 40)}
                    </ReactMarkdown>
                  </div>
                </div>
              ))}
              <div ref={scrollRef} />
            </>
          )}
        </div>
      </ScrollArea>
    </aside>
  )
}
