import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { SectionHeader } from "@/components/magi/terminal"
import { useConfigureSidebar } from "./sidebar-context"

export function ConfigureSidebar() {
  const { currentPage } = useConfigureSidebar()

  return (
    <aside className="flex w-72 shrink-0 flex-col border-l border-border">
      {currentPage?.title && (
        <>
          <div className="flex h-12 items-center px-4">
            <SectionHeader>{currentPage.title}</SectionHeader>
          </div>
          <Separator />
        </>
      )}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {currentPage?.content ?? (
            <p className="text-sm text-muted-foreground uppercase tracking-[0.12em]">
              &gt; SELECT AN ELEMENT TO VIEW ITS PROPERTIES
            </p>
          )}
        </div>
      </ScrollArea>
    </aside>
  )
}
