import { useState, useCallback } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { ChatLeftSidebar, ChatRightSidebar, type AgentThought } from '@/components/chat/chat-sidebars'
import { ChatWindow, type Message } from '@/components/chat/chat-window'
import type { FlowNodeId } from '@/components/configure/flow-canvas'

export const Route = createFileRoute('/_app/chat')({
  component: ChatPage,
})

function ChatPage() {
  const [activeNode, setActiveNode] = useState<FlowNodeId | null>(null)
  const [thoughts, setThoughts] = useState<AgentThought[]>([])
  const [activeChatId, setActiveChatId] = useState<string>("1")

  // This function mocks what a websocket would do when receiving messages/events
  const handleSendMessage = useCallback((text: string) => {
    // 1. User sends message -> Orchestrator (Top Node) becomes active
    setTimeout(() => {
      setActiveNode("top")
      setThoughts(prev => [...prev, {
        id: Date.now().toString(),
        agent: "Subagent A (Orchestrator)",
        nodeId: "top",
        message: "Analyzing user request and delegating to Researcher...",
        timestamp: new Date()
      }])
    }, 500)

    // 2. Orchestrator calls Researcher (Bottom-Left Node)
    setTimeout(() => {
      setActiveNode("bottom-left")
      setThoughts(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        agent: "Subagent B (Researcher)",
        nodeId: "bottom-left",
        message: "Searching documentation for relevant context...",
        timestamp: new Date()
      }])
    }, 2000)

    // 3. Researcher finishes, Orchestrator calls Writer (Bottom-Right Node)
    setTimeout(() => {
      setActiveNode("bottom-right")
      setThoughts(prev => [...prev, {
        id: (Date.now() + 2).toString(),
        agent: "Subagent C (Writer)",
        nodeId: "bottom-right",
        message: "Drafting response based on research...",
        timestamp: new Date()
      }])
    }, 3500)

    // 4. Writer finishes, Orchestrator returns to idle
    setTimeout(() => {
      setActiveNode(null)
    }, 5000)
  }, [])

  const handleSelectChat = (id: string) => {
    setActiveChatId(id)
    // Here you would fetch the messages for the selected chat ID from your backend
  }

  const handleNewChat = () => {
    // Here you would create a new chat in the backend and navigate to it
    // For now, we'll just console log to show it's connected
    console.log("Create new chat!")
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Left sidebar - Chat History */}
      <ChatLeftSidebar 
        activeChatId={activeChatId}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
      />

      {/* Main chat area */}
      <div className="flex flex-1 flex-col border-r border-border/40 relative">
        {/* We key the ChatWindow by activeChatId so it resets its internal state when switching mock chats */}
        <ChatWindow key={activeChatId} onSendMessage={handleSendMessage} />
      </div>

      {/* Right sidebar - Mini Graph & Thoughts */}
      <ChatRightSidebar activeNode={activeNode} thoughts={thoughts} />
    </div>
  )
}
