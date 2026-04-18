import { useState } from "react"
import { cn } from "@/lib/utils"

export type FlowNodeId = "top" | "bottom-left" | "bottom-right"

type FlowCanvasProps = {
  onNodeClick?: (nodeId: FlowNodeId) => void
  selectedNode?: FlowNodeId | null
}

export function FlowCanvas({ onNodeClick, selectedNode }: FlowCanvasProps) {
  const [hoveredNode, setHoveredNode] = useState<FlowNodeId | null>(null)

  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <svg
        viewBox="0 0 800 650"
        className="h-full max-h-[calc(100svh-5rem)] w-full max-w-3xl"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Connection lines */}
        {/* Top to Bottom-Left */}
        <line
          x1="310"
          y1="280"
          x2="210"
          y2="370"
          className="stroke-foreground"
          strokeWidth="6"
          strokeLinecap="round"
        />
        {/* Top to Bottom-Right */}
        <line
          x1="490"
          y1="280"
          x2="590"
          y2="370"
          className="stroke-foreground"
          strokeWidth="6"
          strokeLinecap="round"
        />
        {/* Bottom-Left to Bottom-Right */}
        <line
          x1="300"
          y1="490"
          x2="500"
          y2="490"
          className="stroke-foreground"
          strokeWidth="6"
          strokeLinecap="round"
        />

        {/* Top Node — rectangle with bottom corners clipped */}
        <g
          className="cursor-pointer"
          onClick={() => onNodeClick?.("top")}
          onMouseEnter={() => setHoveredNode("top")}
          onMouseLeave={() => setHoveredNode(null)}
          role="button"
          tabIndex={0}
          aria-label="Top node"
        >
          <path
            d="M220,40 L580,40 L580,240 L520,300 L280,300 L220,240 Z"
            className={cn(
              "transition-all duration-200",
              selectedNode === "top"
                ? "fill-accent stroke-primary stroke-2"
                : hoveredNode === "top"
                  ? "fill-accent/80 stroke-muted-foreground/40 stroke-1"
                  : "fill-muted stroke-transparent"
            )}
          />
        </g>

        {/* Bottom-Left Node — rectangle with top-right corner clipped */}
        <g
          className="cursor-pointer"
          onClick={() => onNodeClick?.("bottom-left")}
          onMouseEnter={() => setHoveredNode("bottom-left")}
          onMouseLeave={() => setHoveredNode(null)}
          role="button"
          tabIndex={0}
          aria-label="Bottom-left node"
        >
          <path
            d="M30,370 L260,370 L310,430 L310,610 L30,610 Z"
            className={cn(
              "transition-all duration-200",
              selectedNode === "bottom-left"
                ? "fill-accent stroke-primary stroke-2"
                : hoveredNode === "bottom-left"
                  ? "fill-accent/80 stroke-muted-foreground/40 stroke-1"
                  : "fill-muted stroke-transparent"
            )}
          />
        </g>

        {/* Bottom-Right Node — rectangle with top-left corner clipped */}
        <g
          className="cursor-pointer"
          onClick={() => onNodeClick?.("bottom-right")}
          onMouseEnter={() => setHoveredNode("bottom-right")}
          onMouseLeave={() => setHoveredNode(null)}
          role="button"
          tabIndex={0}
          aria-label="Bottom-right node"
        >
          <path
            d="M490,430 L540,370 L770,370 L770,610 L490,610 Z"
            className={cn(
              "transition-all duration-200",
              selectedNode === "bottom-right"
                ? "fill-accent stroke-primary stroke-2"
                : hoveredNode === "bottom-right"
                  ? "fill-accent/80 stroke-muted-foreground/40 stroke-1"
                  : "fill-muted stroke-transparent"
            )}
          />
        </g>
      </svg>
    </div>
  )
}
