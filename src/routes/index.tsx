import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: LandingPage,
})

function LandingPage() {
  return (
    <div className="flex min-h-svh items-center justify-center">
      <h1 className="text-4xl font-bold tracking-tight">Landing Page</h1>
    </div>
  )
}
