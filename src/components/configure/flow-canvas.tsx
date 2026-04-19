import { useMemo, useState } from "react"
import { cn } from "@/lib/utils"
import { GLYPH_HEIGHT, toAsciiBlock } from "@/utils/ascii-block"

export type FlowNodeId = "top" | "bottom-left" | "bottom-right"

type NodeTextLines = string[]

type FlowCanvasProps = {
  onNodeClick?: (nodeId: FlowNodeId) => void
  selectedNode?: FlowNodeId | null
  activeNode?: FlowNodeId | null
  nodeTexts?: Partial<Record<FlowNodeId, NodeTextLines>>
  mini?: boolean
}

/**
 * Renders a MAGI-style ASCII wordmark of `name` inside the supplied SVG-
 * coordinate rectangle.
 *
 * Implementation: we expand the name into a 5-row block grid, then render one
 * `<rect>` per filled cell into a nested `<svg>` whose viewBox matches the
 * grid dimensions (cols x 5). The outer svg uses
 * `preserveAspectRatio="xMidYMid meet"`, so the whole wordmark scales
 * uniformly to fit the safe zone while staying perfectly centered. Short
 * names (e.g. "CASPER") render huge; long names (e.g. "BALTHASAR") shrink
 * down, always without clipping or font-metric guesswork.
 */
function InteriorAsciiName({
  name,
  x,
  y,
  width,
  height,
  padding = 0.04,
}: {
  name: string
  x: number
  y: number
  width: number
  height: number
  padding?: number
}) {
  const cleaned = name.trim().toUpperCase().slice(0, 16)

  const { cols, rects } = useMemo(() => {
    if (!cleaned) return { cols: 0, rects: [] as Array<[number, number]> }
    const rows = toAsciiBlock(cleaned).split("\n")
    const filled: Array<[number, number]> = []
    rows.forEach((row, r) => {
      for (let c = 0; c < row.length; c++) {
        if (row[c] === "█") filled.push([c, r])
      }
    })
    return { cols: rows[0]?.length ?? 0, rects: filled }
  }, [cleaned])

  if (!cleaned || cols === 0) return null

  const padX = width * padding
  const padY = height * padding
  const innerX = x + padX
  const innerY = y + padY
  const innerW = Math.max(1, width - padX * 2)
  const innerH = Math.max(1, height - padY * 2)

  return (
    <svg
      x={innerX}
      y={innerY}
      width={innerW}
      height={innerH}
      viewBox={`0 0 ${cols} ${GLYPH_HEIGHT}`}
      preserveAspectRatio="xMidYMid meet"
      pointerEvents="none"
      shapeRendering="crispEdges"
    >
      <title>{cleaned}</title>
      {rects.map(([cx, cy]) => (
        <rect
          key={`${cx}-${cy}`}
          x={cx}
          y={cy}
          width={1}
          height={1}
          className="fill-primary"
        />
      ))}
    </svg>
  )
}

/**
 * Renders a stacked list of MAGI-style `> LABEL` lines inside a foreignObject
 * so they can flow with HTML truncation while living in SVG coordinates. Used
 * for the per-node labels that sit OUTSIDE each shape (right of the top node,
 * left of the bottom-left node, right of the bottom-right node).
 */
function ExteriorTextLines({
  lines,
  x,
  y,
  width,
  height,
  align = "left",
  lineHeight = 36,
}: {
  lines: string[]
  x: number
  y: number
  width: number
  height: number
  align?: "left" | "right"
  lineHeight?: number
}) {
  if (lines.length === 0) return null
  return (
    <foreignObject x={x} y={y} width={width} height={height}>
      <div
        className={cn(
          "flex h-full w-full flex-col justify-start gap-1 overflow-hidden",
          align === "right" ? "items-end" : "items-start"
        )}
      >
        {lines.map((text, i) => (
          <div
            key={i}
            className="flex w-full min-w-0 items-center gap-2"
            style={{ height: lineHeight }}
          >
            <span className="shrink-0 text-muted-foreground text-[13px] font-mono">
              &gt;
            </span>
            <span className="min-w-0 flex-1 truncate text-[12px] uppercase tracking-[0.12em] text-foreground font-mono">
              {text}
            </span>
          </div>
        ))}
      </div>
    </foreignObject>
  )
}

export function FlowCanvas({
  onNodeClick,
  selectedNode,
  activeNode,
  nodeTexts = {},
  mini = false,
}: FlowCanvasProps) {
  const [hoveredNode, setHoveredNode] = useState<FlowNodeId | null>(null)

  const topLines = nodeTexts["top"] ?? []
  const bottomLeftLines = nodeTexts["bottom-left"] ?? []
  const bottomRightLines = nodeTexts["bottom-right"] ?? []

  // The first line in each node's text block is conventionally the agent's
  // display name; that's what we render as the giant ASCII wordmark inside
  // the shape.
  const topName = topLines[0] ?? ""
  const bottomLeftName = bottomLeftLines[0] ?? ""
  const bottomRightName = bottomRightLines[0] ?? ""

  // Shared viewBox — the three shapes extend to all four frame edges so
  // main and mini render from the same coordinate system.
  const viewBox = "0 0 1340 860"

  return (
    <div
      className={cn(
        "flex flex-1 items-center justify-center",
        mini ? "h-full w-full" : "p-4"
      )}
    >
      <svg
        viewBox={viewBox}
        className={cn("w-full", mini ? "h-full" : "h-full max-h-[calc(100svh-5rem)]")}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Thick structural trunks plugging into the middle of each slope.
            With the bottom shapes pushed outward, each diagonal now fans out
            from the top node (down-left to BL, down-right to BR) with enough
            horizontal sweep to read as a smooth diagonal instead of a
            cramped, near-vertical sliver. */}
        {/* Top <-> Bottom-Left: top's bottom-left slope midpoint -> BL's top-right slope midpoint */}
        <line
          x1="540"
          y1="320"
          x2="440"
          y2="480"
          className="stroke-muted-foreground"
          strokeWidth="14"
          strokeLinecap="butt"
        />
        {/* Top <-> Bottom-Right: top's bottom-right slope midpoint -> BR's top-left slope midpoint */}
        <line
          x1="820"
          y1="320"
          x2="900"
          y2="480"
          className="stroke-muted-foreground"
          strokeWidth="14"
          strokeLinecap="butt"
        />
        {/* Bottom-Left <-> Bottom-Right horizontal trunk, plugging into the
            midpoint of each shape's inner vertical edge. */}
        <line
          x1="480"
          y1="620"
          x2="860"
          y2="620"
          className="stroke-muted-foreground"
          strokeWidth="14"
          strokeLinecap="butt"
        />

        {/* Top Node — rectangle with both bottom corners clipped, sized so
            there's room for its label column on the right. */}
        <g
          className={cn(onNodeClick && "cursor-pointer")}
          onClick={() => onNodeClick?.("top")}
          onMouseEnter={() => !mini && setHoveredNode("top")}
          onMouseLeave={() => !mini && setHoveredNode(null)}
          role="button"
          tabIndex={onNodeClick ? 0 : -1}
          aria-label="Top node"
        >
          <path
            d="M500,80 L860,80 L860,280 L780,360 L580,360 L500,280 Z"
            className={cn(
              "transition-all duration-200",
              activeNode === "top"
                ? "fill-accent stroke-primary stroke-2 animate-pulse drop-shadow-[0_0_10px_oklch(0.78_0.07_70/0.55)]"
                : selectedNode === "top"
                  ? "fill-accent stroke-primary stroke-2"
                  : hoveredNode === "top"
                    ? "fill-accent/70 stroke-primary/50 stroke-1"
                    : "fill-muted stroke-border stroke-1"
            )}
          />
        </g>

        {!mini && (
          <InteriorAsciiName
            name={topName}
            x={505}
            y={95}
            width={350}
            height={180}
          />
        )}

        {!mini && (
          <ExteriorTextLines
            lines={topLines}
            x={900}
            y={100}
            width={420}
            height={220}
            align="left"
          />
        )}

        {/* Bottom-Left Node — rectangle with top-right corner clipped, sized
            so there's room for its label column on the left. */}
        <g
          className={cn(onNodeClick && "cursor-pointer")}
          onClick={() => onNodeClick?.("bottom-left")}
          onMouseEnter={() => !mini && setHoveredNode("bottom-left")}
          onMouseLeave={() => !mini && setHoveredNode(null)}
          role="button"
          tabIndex={onNodeClick ? 0 : -1}
          aria-label="Bottom-left node"
        >
          <path
            d="M180,440 L400,440 L480,520 L480,720 L180,720 Z"
            className={cn(
              "transition-all duration-200",
              activeNode === "bottom-left"
                ? "fill-accent stroke-primary stroke-2 animate-pulse drop-shadow-[0_0_10px_oklch(0.78_0.07_70/0.55)]"
                : selectedNode === "bottom-left"
                  ? "fill-accent stroke-primary stroke-2"
                  : hoveredNode === "bottom-left"
                    ? "fill-accent/70 stroke-primary/50 stroke-1"
                    : "fill-muted stroke-border stroke-1"
            )}
          />
        </g>

        {!mini && (
          <InteriorAsciiName
            name={bottomLeftName}
            x={185}
            y={530}
            width={290}
            height={185}
          />
        )}

        {!mini && (
          <ExteriorTextLines
            lines={bottomLeftLines}
            x={20}
            y={460}
            width={140}
            height={260}
            align="left"
          />
        )}

        {/* Bottom-Right Node — rectangle with top-left corner clipped, sized
            so there's room for its label column on the right. */}
        <g
          className={cn(onNodeClick && "cursor-pointer")}
          onClick={() => onNodeClick?.("bottom-right")}
          onMouseEnter={() => !mini && setHoveredNode("bottom-right")}
          onMouseLeave={() => !mini && setHoveredNode(null)}
          role="button"
          tabIndex={onNodeClick ? 0 : -1}
          aria-label="Bottom-right node"
        >
          <path
            d="M1160,440 L940,440 L860,520 L860,720 L1160,720 Z"
            className={cn(
              "transition-all duration-200",
              activeNode === "bottom-right"
                ? "fill-accent stroke-primary stroke-2 animate-pulse drop-shadow-[0_0_10px_oklch(0.78_0.07_70/0.55)]"
                : selectedNode === "bottom-right"
                  ? "fill-accent stroke-primary stroke-2"
                  : hoveredNode === "bottom-right"
                    ? "fill-accent/70 stroke-primary/50 stroke-1"
                    : "fill-muted stroke-border stroke-1"
            )}
          />
        </g>

        {!mini && (
          <InteriorAsciiName
            name={bottomRightName}
            x={865}
            y={530}
            width={290}
            height={185}
          />
        )}

        {!mini && (
          <ExteriorTextLines
            lines={bottomRightLines}
            x={1180}
            y={460}
            width={140}
            height={260}
            align="left"
          />
        )}
      </svg>
    </div>
  )
}
