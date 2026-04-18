import type { FlowNodeId } from "@/components/configure/flow-canvas"
import type { SubagentConfig } from "@/components/configure/models"

export type Preset = {
  id: string
  name: string
  configs: Record<FlowNodeId, SubagentConfig>
  createdAt: string
}

// Temporary local storage key
const STORAGE_KEY = "cloudhacks_subagent_presets"

// Helper to simulate network latency
const delay = (ms: number) => new Promise(res => setTimeout(res, ms))

/**
 * Fetches all saved presets.
 * Future: GET /api/presets
 */
export async function fetchPresets(): Promise<Preset[]> {
  await delay(400) // Mock latency
  const data = localStorage.getItem(STORAGE_KEY)
  if (!data) return []
  try {
    return JSON.parse(data) as Preset[]
  } catch (e) {
    console.error("Failed to parse presets from local storage", e)
    return []
  }
}

/**
 * Creates a new preset.
 * Future: POST /api/presets
 */
export async function createPreset(name: string, configs: Record<FlowNodeId, SubagentConfig>): Promise<Preset> {
  await delay(600) // Mock latency
  
  const presets = await fetchPresets()
  
  const newPreset: Preset = {
    id: crypto.randomUUID(),
    name,
    configs,
    createdAt: new Date().toISOString()
  }
  
  presets.push(newPreset)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(presets))
  
  return newPreset
}

/**
 * Deletes a preset by ID.
 * Future: DELETE /api/presets/:id
 */
export async function deletePreset(id: string): Promise<void> {
  await delay(500) // Mock latency
  
  const presets = await fetchPresets()
  const filtered = presets.filter(p => p.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
}
