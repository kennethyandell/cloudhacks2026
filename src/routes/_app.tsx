import { createFileRoute, Outlet } from '@tanstack/react-router'
import { TopNav } from '@/components/top-nav'

export const Route = createFileRoute('/_app')({
  component: AppLayout,
})

function AppLayout() {
  return (
    <div className="flex min-h-svh flex-col">
      <TopNav />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}
