import { createFileRoute } from '@tanstack/react-router'
import { ConfigureSidebarProvider } from '@/components/configure/sidebar-context'
import { ConfigureSidebar } from '@/components/configure/configure-sidebar'

export const Route = createFileRoute('/_app/configure')({
  component: ConfigurePage,
})

function ConfigurePage() {
  return (
    <ConfigureSidebarProvider>
      <div className="flex flex-1">
        {/* Main content area */}
        <div className="flex flex-1 items-center justify-center p-6">
          <h1 className="text-4xl font-bold tracking-tight">Configure</h1>
        </div>

        {/* Right sidebar */}
        <ConfigureSidebar />
      </div>
    </ConfigureSidebarProvider>
  )
}
