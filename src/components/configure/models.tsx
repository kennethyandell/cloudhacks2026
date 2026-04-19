import type { IconType } from "react-icons"
import { SiAnthropic } from "react-icons/si"
import { CloudIcon } from "lucide-react"

// Wrapper to make LucideIcon compatible with IconType usage in JSX
function AmazonIcon(props: React.SVGProps<SVGSVGElement>) {
  return <CloudIcon {...props} />
}

export type BedrockModel = {
  id: string
  name: string
  provider: string
  icon: IconType | typeof AmazonIcon
}

export const BEDROCK_MODELS: BedrockModel[] = [
  {
    id: "anthropic.claude-3-5-sonnet-20241022-v2:0",
    name: "Claude 3.5 Sonnet v2",
    provider: "Anthropic",
    icon: SiAnthropic,
  },
  {
    id: "anthropic.claude-3-5-haiku-20241022-v1:0",
    name: "Claude 3.5 Haiku",
    provider: "Anthropic",
    icon: SiAnthropic,
  },
  {
    id: "anthropic.claude-3-opus-20240229-v1:0",
    name: "Claude 3 Opus",
    provider: "Anthropic",
    icon: SiAnthropic,
  },
  {
    id: "us.amazon.nova-pro-v1:0",
    name: "Nova Pro",
    provider: "Amazon",
    icon: AmazonIcon,
  },
  {
    id: "us.amazon.nova-lite-v1:0",
    name: "Nova Lite",
    provider: "Amazon",
    icon: AmazonIcon,
  },
  {
    id: "us.amazon.nova-micro-v1:0",
    name: "Nova Micro",
    provider: "Amazon",
    icon: AmazonIcon,
  },
  {
    id: "amazon.titan-text-premier-v1:0",
    name: "Titan Premier",
    provider: "Amazon",
    icon: AmazonIcon,
  },

  {
    id: "mistral.mistral-large-2407-v1:0",
    name: "Mistral Large 2",
    provider: "Mistral",
    icon: AmazonIcon,
  },
  {
    id: "cohere.command-r-plus-v1:0",
    name: "Command R+",
    provider: "Cohere",
    icon: AmazonIcon,
  },
]

export type SubagentConfig = {
  name: string
  modelId: string
  prompt: string
}

export function getDefaultSubagentConfig(): SubagentConfig {
  return {
    name: "",
    modelId: BEDROCK_MODELS[0].id,
    prompt: "",
  }
}

// Must match the backend's MIN_PROMPT_LENGTH in backend/lambda/crud-db/index.mjs.
// AWS Bedrock's UpdateAgent rejects instructions shorter than this.
export const MIN_PROMPT_LENGTH = 40

export function isValidPrompt(prompt: string): boolean {
  return prompt.trim().length >= MIN_PROMPT_LENGTH
}

export const DEFAULT_SUPERVISOR_PROMPT =
  "You are the MAGI supervisor. Coordinate Melchior, Balthasar, and Casper to answer the user's request with a single synthesized response."
