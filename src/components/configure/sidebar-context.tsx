import { createContext, useContext, useState, useCallback, type ReactNode } from "react"

type SidebarPage = {
  id: string
  title?: string
  content: ReactNode
}

type ConfigureSidebarContextValue = {
  currentPage: SidebarPage | null
  setPage: (page: SidebarPage) => void
  clearPage: () => void
}

const ConfigureSidebarContext = createContext<ConfigureSidebarContextValue | null>(null)

export function ConfigureSidebarProvider({ children }: { children: ReactNode }) {
  const [currentPage, setCurrentPage] = useState<SidebarPage | null>(null)

  const setPage = useCallback((page: SidebarPage) => {
    setCurrentPage(page)
  }, [])

  const clearPage = useCallback(() => {
    setCurrentPage(null)
  }, [])

  return (
    <ConfigureSidebarContext.Provider value={{ currentPage, setPage, clearPage }}>
      {children}
    </ConfigureSidebarContext.Provider>
  )
}

export function useConfigureSidebar() {
  const context = useContext(ConfigureSidebarContext)
  if (!context) {
    throw new Error("useConfigureSidebar must be used within a ConfigureSidebarProvider")
  }
  return context
}
