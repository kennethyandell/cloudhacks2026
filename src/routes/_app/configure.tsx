import { useState, useCallback, useEffect } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { ConfigureSidebarProvider } from '@/components/configure/sidebar-context'
import { ConfigureSidebar } from '@/components/configure/configure-sidebar'
import { FlowCanvas, type FlowNodeId } from '@/components/configure/flow-canvas'
import { useConfigureSidebar } from '@/components/configure/sidebar-context'
import { SubagentForm } from '@/components/configure/subagent-form'
import { type SubagentConfig, BEDROCK_MODELS } from '@/components/configure/models'
import { PresetManager } from '@/components/configure/preset-manager'
import { api } from '@/utils/api'
import { NODE_TO_AGENT } from '@/lib/constants'

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
      setConfigs((prev) => {
        const next = { ...prev, [nodeId]: config }
        
        api.presets.save({
          userId: "default-user",
          name: "Current Preset",
          melchior: { prompt: next["top"].prompt, model: next["top"].modelId },
          balthasar: { prompt: next["bottom-left"].prompt, model: next["bottom-left"].modelId },
          casper: { prompt: next["bottom-right"].prompt, model: next["bottom-right"].modelId },
          supervisor: { prompt: "Default supervisor prompt" }
        }).catch(err => console.error("Failed to save preset", err))

        return next
      })
    },
    []
  )

  useEffect(() => {
    api.presets.list("default-user").then((items: any[]) => {
      if (items && items.length > 0) {
        // Find latest preset
        const latest = items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
        setConfigs({
          "top": { name: latest.name || "Subagent A", modelId: latest.melchior?.model || BEDROCK_MODELS[0].id, prompt: latest.melchior?.prompt || "" },
          "bottom-left": { name: latest.name || "Subagent B", modelId: latest.balthasar?.model || BEDROCK_MODELS[0].id, prompt: latest.balthasar?.prompt || "" },
          "bottom-right": { name: latest.name || "Subagent C", modelId: latest.casper?.model || BEDROCK_MODELS[0].id, prompt: latest.casper?.prompt || "" },
        })
      }
    }).catch(err => console.error("Failed to load presets", err))
  }, [])

  const handleApplyPreset = useCallback((presetConfigs: Record<FlowNodeId, SubagentConfig>) => {
    setConfigs(presetConfigs)
    setSelectedNode(null)
  }, [])

  // Mount PresetManager in sidebar when no node is selected
  useEffect(() => {
    if (selectedNode === null) {
      setPage({
        id: "presets",
        title: "Configuration Presets",
        content: (
          <PresetManager 
            currentConfigs={configs}
            onApplyPreset={handleApplyPreset}
          />
        )
      })
    }
  }, [selectedNode, configs, setPage, handleApplyPreset])

  function handleNodeClick(nodeId: FlowNodeId) {
    if (selectedNode === nodeId) {
      setSelectedNode(null)
      // We don't call clearPage() anymore, as the useEffect will seamlessly swap in the PresetManager.
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
