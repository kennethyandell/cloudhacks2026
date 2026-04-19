import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

/**
 * MAGI terminal design primitives shared by the landing page and the rest of
 * the app. Everything here is purely visual — no behavior.
 */

/** A `> LABEL .......... [ OK ]` boot-sequence row. */
export function BootLine({
  label,
  status = "OK",
  className,
}: {
  label: string
  status?: string
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex items-baseline gap-2 text-[13px] leading-6",
        className
      )}
    >
      <span className="text-muted-foreground">&gt;</span>
      <span className="uppercase tracking-[0.12em] text-foreground">
        {label}
      </span>
      <span
        aria-hidden
        className="flex-1 translate-y-[-3px] border-b border-dotted border-border"
      />
      <span className="tracking-[0.2em] text-primary">[ {status} ]</span>
    </div>
  )
}

/** One of four L-shaped corner marks that frame a region. */
export function CornerBracket({
  position,
  className,
}: {
  position: "tl" | "tr" | "bl" | "br"
  className?: string
}) {
  const map: Record<typeof position, string> = {
    tl: "top-0 left-0 border-t border-l",
    tr: "top-0 right-0 border-t border-r",
    bl: "bottom-0 left-0 border-b border-l",
    br: "bottom-0 right-0 border-b border-r",
  }
  return (
    <span
      aria-hidden
      className={cn(
        "absolute h-3 w-3 border-muted-foreground/60",
        map[position],
        className
      )}
    />
  )
}

/**
 * An uppercase tracked amber section header with a muted `>` prefix. Replaces
 * plain `<h2>` tags across the app so every surface reads like a MAGI
 * terminal panel.
 */
export function SectionHeader({
  children,
  prefix = ">",
  as: Tag = "h2",
  className,
}: {
  children: ReactNode
  prefix?: string
  as?: "h1" | "h2" | "h3"
  className?: string
}) {
  return (
    <Tag
      className={cn(
        "flex items-baseline gap-2 text-[12px] font-medium uppercase tracking-[0.22em] text-primary",
        className
      )}
    >
      <span className="text-muted-foreground">{prefix}</span>
      <span>{children}</span>
    </Tag>
  )
}

/** The ASCII `MAGI` wordmark from the landing page. */
export function MagiWordmark({
  size = "lg",
  className,
}: {
  size?: "sm" | "md" | "lg"
  className?: string
}) {
  const fontSize =
    size === "sm" ? "10px" : size === "md" ? "16px" : "22px"
  return (
    <pre
      aria-label="MAGI"
      className={cn(
        "select-none font-mono text-primary leading-none tracking-normal m-0",
        className
      )}
      style={{ fontSize, whiteSpace: "pre" }}
    >{`█   █  ███   ████  █
██ ██ █   █ █      █
█ █ █ █████ █  ██  █
█   █ █   █ █   █  █
█   █ █   █  ███   █`}</pre>
  )
}

/** Small single-line `[ MAGI ]` token, useful in tight nav bars. */
export function MagiBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "font-mono text-[12px] tracking-[0.28em] uppercase text-primary",
        className
      )}
    >
      [ MAGI ]
    </span>
  )
}
