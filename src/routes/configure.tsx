import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/configure')({
  component: ConfigurePage,
})

function ConfigurePage() {
  return (
    <div className="flex min-h-svh items-center justify-center">
      <h1 className="text-4xl font-bold tracking-tight">Configure</h1>
    </div>
  )
}
