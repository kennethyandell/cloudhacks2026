import { useState, useCallback } from "react"
import { SaveIcon } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
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
  Field,
  FieldGroup,
  FieldLabel,
  FieldDescription,
} from "@/components/ui/field"
import {
  BEDROCK_MODELS,
  MIN_PROMPT_LENGTH,
  isValidPrompt,
  type SubagentConfig,
  getDefaultSubagentConfig,
} from "./models"
import type { FlowNodeId } from "./flow-canvas"

type SubagentFormProps = {
  nodeId: FlowNodeId
  initialValues?: SubagentConfig
  onSave?: (nodeId: FlowNodeId, config: SubagentConfig) => void
}

export function SubagentForm({
  nodeId,
  initialValues,
  onSave,
}: SubagentFormProps) {
  const [config, setConfig] = useState<SubagentConfig>(
    initialValues ?? getDefaultSubagentConfig()
  )

  const handleSave = useCallback(() => {
    onSave?.(nodeId, config)
  }, [nodeId, config, onSave])

  // Group models by provider
  const modelsByProvider = BEDROCK_MODELS.reduce(
    (acc, model) => {
      if (!acc[model.provider]) acc[model.provider] = []
      acc[model.provider].push(model)
      return acc
    },
    {} as Record<string, typeof BEDROCK_MODELS>
  )

  const selectedModel = BEDROCK_MODELS.find((m) => m.id === config.modelId)

  const promptLength = config.prompt.trim().length
  const promptValid = isValidPrompt(config.prompt)
  const nameValid = config.name.trim().length > 0
  const canSave = promptValid && nameValid

  return (
    <FieldGroup>
      {/* Subagent Name */}
      <Field>
        <FieldLabel htmlFor={`name-${nodeId}`}>Subagent Name</FieldLabel>
        <Input
          id={`name-${nodeId}`}
          placeholder="Enter subagent name…"
          value={config.name}
          onChange={(e) =>
            setConfig((prev) => ({ ...prev, name: e.target.value }))
          }
        />
      </Field>

      {/* LLM Model Select */}
      <Field>
        <FieldLabel htmlFor={`model-${nodeId}`}>LLM Model</FieldLabel>
        <FieldDescription>
          Amazon Bedrock model used for inference.
        </FieldDescription>
        <Select
          value={config.modelId}
          onValueChange={(value) =>
            setConfig((prev) => ({ ...prev, modelId: value }))
          }
        >
          <SelectTrigger id={`model-${nodeId}`} className="w-full">
            <SelectValue>
              {selectedModel && (
                <>
                  <selectedModel.icon data-icon />
                  {selectedModel.name}
                </>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {Object.entries(modelsByProvider).map(([provider, models]) => (
              <SelectGroup key={provider}>
                <SelectLabel>{provider}</SelectLabel>
                {models.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    <model.icon data-icon />
                    {model.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
      </Field>

      {/* Custom Prompt */}
      <Field>
        <FieldLabel htmlFor={`prompt-${nodeId}`}>System Prompt</FieldLabel>
        <FieldDescription>
          Instructions that define this subagent's behavior. Must be at least{" "}
          {MIN_PROMPT_LENGTH} characters.
        </FieldDescription>
        <Textarea
          id={`prompt-${nodeId}`}
          placeholder="You are a helpful assistant that…"
          className="min-h-32 resize-y"
          value={config.prompt}
          onChange={(e) =>
            setConfig((prev) => ({ ...prev, prompt: e.target.value }))
          }
        />
        <p
          className={
            "text-xs tabular-nums " +
            (promptValid ? "text-muted-foreground" : "text-destructive")
          }
        >
          {promptLength}/{MIN_PROMPT_LENGTH} minimum
        </p>
      </Field>

      {/* Save Button */}
      <Button onClick={handleSave} disabled={!canSave} className="w-full">
        <SaveIcon data-icon="inline-start" />
        Save Configuration
      </Button>
    </FieldGroup>
  )
}
