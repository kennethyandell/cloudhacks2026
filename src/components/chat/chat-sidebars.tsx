import type { ReactNode } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { FlowCanvas, type FlowNodeId } from "@/components/configure/flow-canvas"
import { MessageSquareIcon, ActivityIcon, PlusIcon } from "lucide-react"
import { cn } from "@/lib/utils"

type ChatSidebarProps = {
  title?: string
  children?: ReactNode
  className?: string
}

type ChatLeftSidebarProps = ChatSidebarProps & {
  activeChatId?: string
  onSelectChat?: (id: string) => void
  onNewChat?: () => void
}

export function ChatLeftSidebar({ 
  title = "Previous Chats",
  activeChatId = "1",
  onSelectChat,
  onNewChat
}: ChatLeftSidebarProps) {
  // Mock chat history
  const previousChats = [
    { id: "1", title: "API Integration Plan", date: "2 hours ago" },
    { id: "2", title: "Database Schema Design", date: "Yesterday" },
    { id: "3", title: "UI Feedback Revisions", date: "Oct 12" },
    { id: "4", title: "Authentication Setup", date: "Oct 10" },
  ]

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-border/40 bg-muted/20">
      <div className="flex h-14 items-center justify-between px-4 border-b border-border/40">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        <Button size="icon" variant="ghost" className="size-8 rounded-full" onClick={onNewChat} title="New Chat">
          <PlusIcon className="size-4" />
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-1 p-3">
          {previousChats.map((chat) => (
            <Button
              key={chat.id}
              variant={activeChatId === chat.id ? "secondary" : "ghost"}
              className="justify-start px-3 py-2 h-auto font-normal text-left"
              onClick={() => onSelectChat?.(chat.id)}
            >
              <MessageSquareIcon className="mr-2 size-4 shrink-0 text-muted-foreground" />
              <div className="flex flex-col gap-0.5 overflow-hidden">
                <span className="truncate text-sm font-medium">{chat.title}</span>
                <span className="text-xs text-muted-foreground">{chat.date}</span>
              </div>
            </Button>
          ))}
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

export function ChatRightSidebar({
  title = "Agent Activity",
  activeNode,
  thoughts = [],
}: ChatRightSidebarProps) {
  return (
    <aside className="flex w-80 shrink-0 flex-col border-l border-border/40 bg-muted/10">
      <div className="flex h-14 items-center px-4 border-b border-border/40">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      </div>
      
      {/* Miniature Graph Top Section */}
      <div className="h-48 shrink-0 border-b border-border/40 bg-background/50 relative">
        <div className="absolute top-2 left-3 text-xs font-medium text-muted-foreground">
          Architecture
        </div>
        <FlowCanvas mini activeNode={activeNode} />
      </div>

      {/* Agents' Thoughts Bottom Section */}
      <div className="flex h-10 items-center px-4 border-b border-border/40 bg-muted/20">
        <ActivityIcon className="mr-2 size-4 text-primary" />
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Subagent Thoughts Stream
        </h3>
      </div>
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-4 p-4">
          {thoughts.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center italic mt-4">
              Waiting for subagent activity...
            </p>
          ) : (
            thoughts.map((thought) => (
              <div key={thought.id} className="flex flex-col gap-1.5 text-sm">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "size-2 rounded-full",
                    thought.nodeId === "top" ? "bg-blue-500" :
                    thought.nodeId === "bottom-left" ? "bg-purple-500" : "bg-emerald-500"
                  )} />
                  <span className="font-semibold text-foreground">{thought.agent}</span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {thought.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
                <div className="rounded-lg border border-border/50 bg-background/50 p-2.5 text-muted-foreground">
                  {thought.message}
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </aside>
  )
}
