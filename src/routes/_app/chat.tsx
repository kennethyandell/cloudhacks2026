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
        // Debug: log full trace to verify Bedrock TracePart shape
        console.log("TRACE:", JSON.stringify(trace, null, 2))

        // Only show sub-agent thoughts — skip supervisor traces entirely.
        // TracePart.collaboratorName is set when the trace originates from a sub-agent.
        const collaboratorName: string = trace?.collaboratorName || ""
        if (!collaboratorName) return

        // TracePart wraps an inner .trace object that contains orchestrationTrace
        const orchestration = trace?.trace?.orchestrationTrace
        if (!orchestration) return // skip non-orchestration traces

        // 1. rationale.text — the agent's chain-of-thought (only some models emit this)
        const rationaleText: string = orchestration?.rationale?.text || ""

        // 2. Sub-agent's final answer (observation.finalResponse.text)
        const finalResponseText: string =
          orchestration?.observation?.finalResponse?.text || ""

        // 3. Try to extract reasoning from modelInvocationOutput.rawResponse.content
        //    Some models (e.g. GPT) embed reasoningContent in the raw response
        let modelReasoningText = ""
        try {
          const rawContent = orchestration?.modelInvocationOutput?.rawResponse?.content
          if (rawContent) {
            const parsed = JSON.parse(rawContent)
            const contentArr = parsed?.output?.message?.content || []
            for (const item of contentArr) {
              if (item?.reasoningContent?.reasoningText?.text) {
                modelReasoningText = item.reasoningContent.reasoningText.text
                break
              }
            }
          }
        } catch { /* ignore parse errors */ }

        // Priority: rationale > model reasoning > final response
        const message = rationaleText || modelReasoningText || finalResponseText
        if (!message) return // no meaningful content — skip

        // Map Bedrock collaborator names to display names and flow canvas nodes
        let nodeId: FlowNodeId = "top"
        let agentName = collaboratorName

        if (collaboratorName === "collaborator-1")      { nodeId = "top";          agentName = "Melchior" }
        else if (collaboratorName === "collaborator-2") { nodeId = "bottom-left";  agentName = "Balthasar" }
        else if (collaboratorName === "collaborator-3") { nodeId = "bottom-right"; agentName = "Casper" }

        setActiveNode(nodeId)
        setThoughts(prev => [...prev, {
          id: Date.now().toString() + Math.random(),
          agent: agentName,
          nodeId,
          message,
          timestamp: new Date()
        }])
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
