import type { IconType } from "react-icons"
import { SiOpenai, SiMeta, SiAnthropic } from "react-icons/si"
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
    id: "us.meta.llama3-2-90b-instruct-v1:0",
    name: "Llama 3.2 90B",
    provider: "Meta",
    icon: SiMeta,
  },
  {
    id: "us.meta.llama3-2-11b-instruct-v1:0",
    name: "Llama 3.2 11B",
    provider: "Meta",
    icon: SiMeta,
  },
  {
    id: "gpt-4o",
    name: "GPT-4o",
    provider: "OpenAI",
    icon: SiOpenai,
  },
  {
    id: "gpt-4o-mini",
    name: "GPT-4o Mini",
    provider: "OpenAI",
    icon: SiOpenai,
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
