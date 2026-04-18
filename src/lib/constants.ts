import type { FlowNodeId } from "@/components/configure/flow-canvas"

export const NODE_TO_AGENT: Record<FlowNodeId, "melchior" | "balthasar" | "casper"> = {
  "top": "melchior",
  "bottom-left": "balthasar",
  "bottom-right": "casper",
}
