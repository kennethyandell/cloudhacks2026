import { useState, useCallback, useRef } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { ChatLeftSidebar, ChatRightSidebar, type AgentThought } from '@/components/chat/chat-sidebars'
import { ChatWindow, type Message } from '@/components/chat/chat-window'
import type { FlowNodeId } from '@/components/configure/flow-canvas'
import { invokeMagi } from '@/utils/magiStream'
import { api } from '@/utils/api'

export const Route = createFileRoute('/_app/chat')({
  component: ChatPage,
})

function ChatPage() {
  const [activeNode, setActiveNode] = useState<FlowNodeId | null>(null)
  const [thoughts, setThoughts] = useState<AgentThought[]>([])
  const [activeChatId, setActiveChatId] = useState<string>("new")
  const [messages, setMessages] = useState<Message[]>([])
  const messagesRef = useRef<Message[]>([])

  const updateMessages = (newMessages: Message[]) => {
    setMessages(newMessages)
    messagesRef.current = newMessages
  }

  const handleSendMessage = useCallback(async (text: string) => {
    setThoughts([])
    
    // 1. Add user message
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date(),
    }
    
    // 2. Add initial empty supervisor message
    const supervisorMsgId = (Date.now() + 1).toString()
    const supervisorMsg: Message = {
      id: supervisorMsgId,
      role: "supervisor",
      content: "",
      timestamp: new Date(),
    }

    updateMessages([...messagesRef.current, userMsg, supervisorMsg])

    await invokeMagi(
      text,
      `session-${Date.now()}`,
      (chunk) => {
        updateMessages(
          messagesRef.current.map((msg) => 
            msg.id === supervisorMsgId ? { ...msg, content: msg.content + chunk } : msg
          )
        )
      },
      (trace) => {
        // Parse trace
        const rationale = trace?.orchestrationTrace?.rationale || trace?.rationale || ""
        const agentArn = trace?.orchestrationTrace?.invocationInput?.agentAliasArn || trace?.agentAliasArn || trace?.agentName || ""
        
        let nodeId: FlowNodeId | null = null
        let agentName = "Unknown Agent"

        if (agentArn.includes("melchior")) { nodeId = "top"; agentName = "Subagent A (Orchestrator)" }
        else if (agentArn.includes("balthasar")) { nodeId = "bottom-left"; agentName = "Subagent B (Researcher)" }
        else if (agentArn.includes("casper")) { nodeId = "bottom-right"; agentName = "Subagent C (Writer)" }
        else { nodeId = "top"; agentName = "Supervisor" }

        setActiveNode(nodeId)
        if (rationale || agentName) {
           setThoughts(prev => [...prev, {
             id: Date.now().toString() + Math.random(),
             agent: agentName,
             nodeId: nodeId || "top",
             message: rationale || `Agent active: ${agentName}`,
             timestamp: new Date()
           }])
        }
      },
      () => {
        setActiveNode(null)
        // POST /chats to save
        const currentMessages = messagesRef.current
        const firstUserMsg = currentMessages.find(m => m.role === 'user')?.content || "New Chat"
        const title = firstUserMsg.length > 30 ? firstUserMsg.slice(0, 30) + "..." : firstUserMsg

        api.chats.save({
          userId: "default-user",
          chatId: activeChatId === "new" ? `chat-${Date.now()}` : activeChatId,
          title: title,
          messages: currentMessages,
        }).catch(err => console.error("Failed to save chat", err))
      },
      (err) => console.error("Magi error:", err),
    )
  }, [activeChatId])

  const handleSelectChat = (id: string, loadedMessages?: Message[]) => {
    setActiveChatId(id)
    if (loadedMessages) {
       updateMessages(loadedMessages)
    }
  }

  const handleNewChat = () => {
    setActiveChatId("new")
    updateMessages([])
    setThoughts([])
  }

  return (
    <div className="flex flex-1 overflow-hidden min-h-0">
      <ChatLeftSidebar 
        activeChatId={activeChatId}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
      />

      <div className="flex flex-1 flex-col border-r border-border/40 relative min-h-0">
        <ChatWindow key={activeChatId} messages={messages} onSendMessage={handleSendMessage} />
      </div>

      <ChatRightSidebar activeNode={activeNode} thoughts={thoughts} />
    </div>
  )
}
