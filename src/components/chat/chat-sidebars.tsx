import type { ReactNode } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"

type ChatSidebarProps = {
  title?: string
  children?: ReactNode
  className?: string
}

export function ChatLeftSidebar({ title, children }: ChatSidebarProps) {
  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-border/40">
      {title && (
        <>
          <div className="flex h-12 items-center px-4">
            <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          </div>
          <Separator />
        </>
      )}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {children ?? (
            <p className="text-sm text-muted-foreground">No content.</p>
          )}
        </div>
      </ScrollArea>
    </aside>
  )
}

export function ChatRightSidebar({ title, children }: ChatSidebarProps) {
  return (
    <aside className="flex w-72 shrink-0 flex-col border-l border-border/40">
      {title && (
        <>
          <div className="flex h-12 items-center px-4">
            <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          </div>
          <Separator />
        </>
      )}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {children ?? (
            <p className="text-sm text-muted-foreground">No content.</p>
          )}
        </div>
      </ScrollArea>
    </aside>
  )
}
