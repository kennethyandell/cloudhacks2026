import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { ConfigureSidebarProvider } from '@/components/configure/sidebar-context'
import { ConfigureSidebar } from '@/components/configure/configure-sidebar'
import { FlowCanvas, type FlowNodeId } from '@/components/configure/flow-canvas'
import { useConfigureSidebar } from '@/components/configure/sidebar-context'

export const Route = createFileRoute('/_app/configure')({
  component: ConfigurePage,
})

function ConfigurePage() {
  return (
    <ConfigureSidebarProvider>
      <div className="flex flex-1 overflow-hidden">
        <ConfigureContent />
        <ConfigureSidebar />
      </div>
    </ConfigureSidebarProvider>
  )
}

function ConfigureContent() {
  const [selectedNode, setSelectedNode] = useState<FlowNodeId | null>(null)
  const { setPage, clearPage } = useConfigureSidebar()

  const nodeLabels: Record<FlowNodeId, string> = {
    "top": "Top Node",
    "bottom-left": "Bottom-Left Node",
    "bottom-right": "Bottom-Right Node",
  }

  function handleNodeClick(nodeId: FlowNodeId) {
    if (selectedNode === nodeId) {
      setSelectedNode(null)
      clearPage()
      return
    }

    setSelectedNode(nodeId)
    setPage({
      id: nodeId,
      title: nodeLabels[nodeId],
      content: (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            Properties for <span className="font-medium text-foreground">{nodeLabels[nodeId]}</span>
          </p>
          <p className="text-xs text-muted-foreground">
            Configuration options will appear here.
          </p>
        </div>
      ),
    })
  }

  return (
    <FlowCanvas
      selectedNode={selectedNode}
      onNodeClick={handleNodeClick}
    />
  )
}
