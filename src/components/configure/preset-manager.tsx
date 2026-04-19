import { useState, useEffect } from "react"
import { Loader2Icon, PlusIcon, TrashIcon, DownloadIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { fetchPresets, createPreset, deletePreset, type Preset } from "@/api/presets"
import type { FlowNodeId } from "./flow-canvas"
import { MIN_PROMPT_LENGTH, isValidPrompt, type SubagentConfig } from "./models"

type PresetManagerProps = {
  currentConfigs: Record<FlowNodeId, SubagentConfig>
  onApplyPreset: (
    configs: Record<FlowNodeId, SubagentConfig>,
    meta?: { name: string }
  ) => void | Promise<void>
  isApplying?: boolean
}

const NODE_LABELS: Record<FlowNodeId, string> = {
  "top": "Subagent A",
  "bottom-left": "Subagent B",
  "bottom-right": "Subagent C",
}

export function PresetManager({ currentConfigs, onApplyPreset, isApplying = false }: PresetManagerProps) {
  const [presets, setPresets] = useState<Preset[]>([])
  const [selectedPresetId, setSelectedPresetId] = useState<string>("")
  const selectedPreset = presets.find((p) => p.id === selectedPresetId)
  const isReadonly = !!selectedPreset?.isDefault
  const defaultPresets = presets.filter((p) => p.isDefault)
  const userPresets = presets.filter((p) => !p.isDefault)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [newPresetName, setNewPresetName] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [applyError, setApplyError] = useState<string | null>(null)

  useEffect(() => {
    loadPresets()
  }, [])

  async function loadPresets() {
    setIsLoading(true)
    try {
      const data = await fetchPresets()
      setPresets(data)
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleCreatePreset(e: React.FormEvent) {
    e.preventDefault()
    if (!newPresetName.trim()) return

    setIsSaving(true)
    try {
      const newPreset = await createPreset(newPresetName, currentConfigs)
      setPresets(prev => [...prev, newPreset])
      setSelectedPresetId(newPreset.id)
      setNewPresetName("")
      setIsDialogOpen(false)
    } catch (e) {
      console.error(e)
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDeletePreset() {
    if (!selectedPresetId) return

    setIsDeleting(true)
    try {
      await deletePreset(selectedPresetId)
      setPresets(prev => prev.filter(p => p.id !== selectedPresetId))
      setSelectedPresetId("")
    } catch (e) {
      console.error(e)
    } finally {
      setIsDeleting(false)
    }
  }

  async function handleApply() {
    const preset = presets.find(p => p.id === selectedPresetId)
    if (!preset) return

    const invalid = (Object.keys(preset.configs) as FlowNodeId[]).filter(
      (nodeId) => !isValidPrompt(preset.configs[nodeId].prompt)
    )

    if (invalid.length > 0) {
      const names = invalid.map((nodeId) => NODE_LABELS[nodeId]).join(", ")
      setApplyError(
        `Prompts for ${names} must be at least ${MIN_PROMPT_LENGTH} characters before applying.`
      )
      return
    }

    setApplyError(null)
    await onApplyPreset(preset.configs, { name: preset.name })
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-muted-foreground gap-4">
        <Loader2Icon className="size-6 animate-spin" />
        <p className="text-sm">Loading presets...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-2">
        <Label>Select Preset</Label>
        <div className="flex gap-2">
          <Select value={selectedPresetId} onValueChange={setSelectedPresetId}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Choose a preset" />
            </SelectTrigger>
            <SelectContent>
              {presets.length === 0 ? (
                <SelectItem value="none" disabled>No presets found</SelectItem>
              ) : (
                <>
                  {defaultPresets.length > 0 && (
                    <SelectGroup>
                      <SelectLabel>Default Presets</SelectLabel>
                      {defaultPresets.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectGroup>
                  )}
                  {userPresets.length > 0 && (
                    <SelectGroup>
                      <SelectLabel>Your Presets</SelectLabel>
                      {userPresets.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectGroup>
                  )}
                </>
              )}
            </SelectContent>
          </Select>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon" title="Save current as preset">
                <PlusIcon className="size-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Save Configuration Preset</DialogTitle>
                <DialogDescription>
                  Save the current flow canvas subagent names, models, and prompts for future use.
                  This will be stored in your DynamoDB table.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreatePreset} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="preset-name">Preset Name</Label>
                  <Input 
                    id="preset-name" 
                    placeholder="e.g. Code Review Workflow"
                    value={newPresetName}
                    onChange={(e) => setNewPresetName(e.target.value)}
                    required
                  />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={!newPresetName.trim() || isSaving}>
                    {isSaving && <Loader2Icon className="mr-2 size-4 animate-spin" />}
                    Save Preset
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex gap-2">
        <Button 
          className="flex-1" 
          disabled={!selectedPresetId || selectedPresetId === "none" || isApplying} 
          onClick={handleApply}
        >
          {isApplying ? (
            <Loader2Icon className="mr-2 size-4 animate-spin" />
          ) : (
            <DownloadIcon className="mr-2 size-4" />
          )}
          {isApplying ? "Applying..." : "Apply Preset"}
        </Button>
        <Button 
          variant="destructive" 
          size="icon"
          disabled={!selectedPresetId || selectedPresetId === "none" || isDeleting || isApplying || isReadonly}
          onClick={handleDeletePreset}
          title={isReadonly ? "Default presets cannot be deleted" : "Delete selected preset"}
        >
          {isDeleting ? <Loader2Icon className="size-4 animate-spin" /> : <TrashIcon className="size-4" />}
        </Button>
      </div>

      {applyError && (
        <p className="text-sm text-destructive">{applyError}</p>
      )}
      
      {!selectedPresetId && (
        <div className="rounded-lg border border-border/50 bg-muted/20 p-4 mt-4">
          <p className="text-sm text-muted-foreground text-center">
            Presets allow you to quickly swap out the models and prompts for all 3 subagents at once. 
            Once your backend is connected, these will sync via DynamoDB.
          </p>
        </div>
      )}
    </div>
  )
}
