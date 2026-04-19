import type { FlowNodeId } from "@/components/configure/flow-canvas"
import type { SubagentConfig } from "@/components/configure/models"
import { DEFAULT_PRESETS } from "./default-presets"

export type Preset = {
  id: string
  name: string
  configs: Record<FlowNodeId, SubagentConfig>
  createdAt: string
  isDefault?: boolean
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
  let userPresets: Preset[] = []
  if (data) {
    try {
      userPresets = JSON.parse(data) as Preset[]
    } catch (e) {
      console.error("Failed to parse presets from local storage", e)
    }
  }
  // Defaults are always returned first and never persisted to local storage.
  return [...DEFAULT_PRESETS, ...userPresets.filter((p) => !p.isDefault)]
}

/**
 * Creates a new preset.
 * Future: POST /api/presets
 */
export async function createPreset(name: string, configs: Record<FlowNodeId, SubagentConfig>): Promise<Preset> {
  await delay(600) // Mock latency

  const userPresets = readUserPresets()

  const newPreset: Preset = {
    id: crypto.randomUUID(),
    name,
    configs,
    createdAt: new Date().toISOString()
  }

  userPresets.push(newPreset)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(userPresets))

  return newPreset
}

/**
 * Deletes a preset by ID.
 * Future: DELETE /api/presets/:id
 */
export async function deletePreset(id: string): Promise<void> {
  await delay(500) // Mock latency

  // Default presets are read-only and not stored in local storage.
  if (id.startsWith("default-")) {
    throw new Error("Default presets cannot be deleted")
  }

  const userPresets = readUserPresets()
  const filtered = userPresets.filter((p) => p.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
}

function readUserPresets(): Preset[] {
  const data = localStorage.getItem(STORAGE_KEY)
  if (!data) return []
  try {
    const parsed = JSON.parse(data) as Preset[]
    return parsed.filter((p) => !p.isDefault)
  } catch (e) {
    console.error("Failed to parse presets from local storage", e)
    return []
  }
}
