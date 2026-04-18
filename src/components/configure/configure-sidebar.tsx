import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { useConfigureSidebar } from "./sidebar-context"

export function ConfigureSidebar() {
  const { currentPage } = useConfigureSidebar()

  return (
    <aside className="flex w-72 shrink-0 flex-col border-l border-border/40">
      {currentPage?.title && (
        <>
          <div className="flex h-12 items-center px-4">
            <h2 className="text-sm font-semibold text-foreground">
              {currentPage.title}
            </h2>
          </div>
          <Separator />
        </>
      )}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {currentPage?.content ?? (
            <p className="text-sm text-muted-foreground">
              Select an element to view its properties.
            </p>
          )}
        </div>
      </ScrollArea>
    </aside>
  )
}
