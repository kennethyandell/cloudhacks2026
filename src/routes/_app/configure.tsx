import { useState, useCallback } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { ConfigureSidebarProvider } from '@/components/configure/sidebar-context'
import { ConfigureSidebar } from '@/components/configure/configure-sidebar'
import { FlowCanvas, type FlowNodeId } from '@/components/configure/flow-canvas'
import { useConfigureSidebar } from '@/components/configure/sidebar-context'
import { SubagentForm } from '@/components/configure/subagent-form'
import { type SubagentConfig, BEDROCK_MODELS } from '@/components/configure/models'

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

  // Store configs per node so edits persist across selections
  const [configs, setConfigs] = useState<Record<FlowNodeId, SubagentConfig>>({
    "top": { name: "", modelId: BEDROCK_MODELS[0].id, prompt: "" },
    "bottom-left": { name: "", modelId: BEDROCK_MODELS[0].id, prompt: "" },
    "bottom-right": { name: "", modelId: BEDROCK_MODELS[0].id, prompt: "" },
  })

  const nodeLabels: Record<FlowNodeId, string> = {
    "top": "Subagent A",
    "bottom-left": "Subagent B",
    "bottom-right": "Subagent C",
  }

  const handleSave = useCallback(
    (nodeId: FlowNodeId, config: SubagentConfig) => {
      setConfigs((prev) => ({ ...prev, [nodeId]: config }))
      // TODO: Send config to API
      console.log(`Saved config for ${nodeId}:`, config)
    },
    []
  )

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
        <SubagentForm
          key={nodeId}
          nodeId={nodeId}
          initialValues={configs[nodeId]}
          onSave={handleSave}
        />
      ),
    })
  }

  // Derive text labels from saved configs for the flow canvas
  const nodeTexts = Object.fromEntries(
    (Object.keys(configs) as FlowNodeId[]).map((nodeId) => {
      const cfg = configs[nodeId]
      const model = BEDROCK_MODELS.find((m) => m.id === cfg.modelId)
      const lines: string[] = []
      if (cfg.name) lines.push(cfg.name)
      if (model) lines.push(`Model: ${model.name}`)
      if (cfg.prompt) lines.push(cfg.prompt.length > 30 ? cfg.prompt.slice(0, 30) + "…" : cfg.prompt)
      return [nodeId, lines]
    })
  ) as Record<FlowNodeId, string[]>

  return (
    <FlowCanvas
      selectedNode={selectedNode}
      onNodeClick={handleNodeClick}
      nodeTexts={nodeTexts}
    />
  )
}
