import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/chat')({
  component: ChatPage,
})

function ChatPage() {
  return (
    <div className="flex min-h-svh items-center justify-center">
      <h1 className="text-4xl font-bold tracking-tight">Chat</h1>
    </div>
  )
}
