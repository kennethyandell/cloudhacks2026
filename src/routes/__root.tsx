import { createRootRoute, Outlet } from '@tanstack/react-router'
import { AgentNamesProvider } from '@/utils/agent-names-context'

export const Route = createRootRoute({
  component: RootLayout,
})

function RootLayout() {
  return (
    <AgentNamesProvider>
      <div className="min-h-svh bg-background text-foreground">
        <Outlet />
      </div>
    </AgentNamesProvider>
  )
}
