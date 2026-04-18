import { useState } from "react"
import { cn } from "@/lib/utils"

export type FlowNodeId = "top" | "bottom-left" | "bottom-right"

type NodeTextLines = string[]

type FlowCanvasProps = {
  onNodeClick?: (nodeId: FlowNodeId) => void
  selectedNode?: FlowNodeId | null
  nodeTexts?: Partial<Record<FlowNodeId, NodeTextLines>>
}

function TextLines({
  lines,
  x,
  y,
  width,
  lineHeight = 36,
}: {
  lines: string[]
  x: number
  y: number
  width: number
  lineHeight?: number
}) {
  return (
    <g>
      {lines.map((text, i) => {
        const lineY = y + i * lineHeight
        return (
          <g key={i}>
            <foreignObject
              x={x}
              y={lineY - lineHeight / 2}
              width={width}
              height={lineHeight}
            >
              <div className="flex h-full w-full items-center">
                <span className="w-full truncate text-[14px] text-foreground font-sans">
                  {text}
                </span>
              </div>
            </foreignObject>
            <line
              x1={x}
              y1={lineY + lineHeight * 0.45}
              x2={x + width}
              y2={lineY + lineHeight * 0.45}
              className="stroke-border"
              strokeWidth="1.5"
            />
          </g>
        )
      })}
    </g>
  )
}

export function FlowCanvas({ onNodeClick, selectedNode, nodeTexts = {} }: FlowCanvasProps) {
  const [hoveredNode, setHoveredNode] = useState<FlowNodeId | null>(null)

  const topLines = nodeTexts["top"] ?? []
  const bottomLeftLines = nodeTexts["bottom-left"] ?? []
  const bottomRightLines = nodeTexts["bottom-right"] ?? []

  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <svg
        viewBox="-20 0 1400 650"
        className="h-full max-h-[calc(100svh-5rem)] w-full"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Connection lines */}
        {/* Top to Bottom-Left */}
        <line
          x1="560"
          y1="280"
          x2="460"
          y2="370"
          className="stroke-foreground"
          strokeWidth="6"
          strokeLinecap="round"
        />
        {/* Top to Bottom-Right */}
        <line
          x1="740"
          y1="280"
          x2="840"
          y2="370"
          className="stroke-foreground"
          strokeWidth="6"
          strokeLinecap="round"
        />
        {/* Bottom-Left to Bottom-Right */}
        <line
          x1="550"
          y1="490"
          x2="750"
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
            d="M470,40 L830,40 L830,240 L770,300 L530,300 L470,240 Z"
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

        {/* Top Node Text — to the right */}
        {topLines.length > 0 && (
          <TextLines lines={topLines} x={860} y={60} width={350} />
        )}

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
            d="M280,370 L510,370 L560,430 L560,610 L280,610 Z"
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

        {/* Bottom-Left Node Text — to the left */}
        {bottomLeftLines.length > 0 && (
          <TextLines lines={bottomLeftLines} x={0} y={390} width={250} />
        )}

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
            d="M740,430 L790,370 L1020,370 L1020,610 L740,610 Z"
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

        {/* Bottom-Right Node Text — to the right */}
        {bottomRightLines.length > 0 && (
          <TextLines lines={bottomRightLines} x={1050} y={390} width={250} />
        )}
      </svg>
    </div>
  )
}
