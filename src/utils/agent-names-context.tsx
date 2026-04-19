import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { api, type AgentNamesResponse } from "@/utils/api"

export type AgentKey = "melchior" | "balthasar" | "casper"

export type AgentNames = {
  melchior: string
  balthasar: string
  casper: string
}

export const DEFAULT_AGENT_NAMES: AgentNames = {
  melchior: "Melchior",
  balthasar: "Balthasar",
  casper: "Casper",
}

type AgentNamesContextValue = {
  names: AgentNames
  /** Replace all three names at once (e.g. when applying a preset). Writes each
   *  changed name through to the backend sentinel row so the next cold boot
   *  sees the updated values. */
  setNames: (names: AgentNames) => void
  /** Update a single agent's display name and write it through to the backend. */
  updateName: (key: AgentKey, name: string) => void
}

const AgentNamesContext = createContext<AgentNamesContextValue | null>(null)

type Props = {
  userId?: string
  children: ReactNode
}

/**
 * App-wide store for subagent display names. Fetches once on mount, then all
 * consumers read from React state so renames propagate instantly (no re-fetch
 * flicker when navigating between pages or opening the loading dialog).
 */
export function AgentNamesProvider({ userId = "default-user", children }: Props) {
  const [names, setNamesState] = useState<AgentNames>(DEFAULT_AGENT_NAMES)
  // Track the latest names the backend has acknowledged so we can skip
  // redundant POSTs when callers re-apply the same value.
  const persistedRef = useRef<AgentNames>(DEFAULT_AGENT_NAMES)

  useEffect(() => {
    let cancelled = false

    Promise.all([
      api.agentNames.get(userId).catch(() => ({} as AgentNamesResponse)),
      api.presets.list(userId).catch(() => [] as any[]),
    ]).then(([agentNames, items]) => {
      if (cancelled) return

      const latest =
        items && items.length > 0
          ? [...items].sort(
              (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
            )[0]
          : null

      const resolved: AgentNames = {
        melchior:
          agentNames.melchior ?? latest?.melchior?.name ?? DEFAULT_AGENT_NAMES.melchior,
        balthasar:
          agentNames.balthasar ?? latest?.balthasar?.name ?? DEFAULT_AGENT_NAMES.balthasar,
        casper:
          agentNames.casper ?? latest?.casper?.name ?? DEFAULT_AGENT_NAMES.casper,
      }
      persistedRef.current = resolved
      setNamesState(resolved)
    })

    return () => {
      cancelled = true
    }
  }, [userId])

  const updateName = useCallback(
    (key: AgentKey, name: string) => {
      const trimmed = name.trim()
      if (!trimmed) return

      setNamesState((prev) => (prev[key] === trimmed ? prev : { ...prev, [key]: trimmed }))

      if (persistedRef.current[key] === trimmed) return
      persistedRef.current = { ...persistedRef.current, [key]: trimmed }

      api.agentNames
        .save({ userId, agentKey: key, name: trimmed })
        .catch((err) => console.error("Failed to persist agent name", err))
    },
    [userId]
  )

  const setNames = useCallback(
    (next: AgentNames) => {
      setNamesState(next)

      const keys: AgentKey[] = ["melchior", "balthasar", "casper"]
      for (const key of keys) {
        const value = next[key]?.trim()
        if (!value) continue
        if (persistedRef.current[key] === value) continue
        persistedRef.current = { ...persistedRef.current, [key]: value }
        api.agentNames
          .save({ userId, agentKey: key, name: value })
          .catch((err) => console.error("Failed to persist agent name", err))
      }
    },
    [userId]
  )

  const value = useMemo<AgentNamesContextValue>(
    () => ({ names, setNames, updateName }),
    [names, setNames, updateName]
  )

  return (
    <AgentNamesContext.Provider value={value}>
      {children}
    </AgentNamesContext.Provider>
  )
}

/** Read the agent-names context. Returns defaults if no provider is mounted so
 *  standalone tests / storybook snippets don't crash. */
export function useAgentNamesContext(): AgentNamesContextValue {
  const ctx = useContext(AgentNamesContext)
  if (ctx) return ctx
  return {
    names: DEFAULT_AGENT_NAMES,
    setNames: () => {},
    updateName: () => {},
  }
}

/** Convenience hook — returns just the current names. */
export function useAgentNames(): AgentNames {
  return useAgentNamesContext().names
}
