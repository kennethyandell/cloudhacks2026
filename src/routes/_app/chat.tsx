import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/chat')({
  component: ChatPage,
})

function ChatPage() {
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <h1 className="text-4xl font-bold tracking-tight">Chat</h1>
    </div>
  )
}
