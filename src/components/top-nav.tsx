import { Link, useRouterState } from "@tanstack/react-router"
import { MagiBadge } from "@/components/magi/terminal"
import { cn } from "@/lib/utils"

const navItems = [
  { label: "Configure", to: "/configure" as const },
  { label: "Chat", to: "/chat" as const },
]

export function TopNav() {
  const routerState = useRouterState()
  const currentPath = routerState.location.pathname

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background">
      <div className="flex h-14 items-center px-6">
        {/* MAGI wordmark */}
        <Link
          to="/"
          className="mr-6 flex items-center gap-2"
          aria-label="MAGI home"
        >
          <MagiBadge />
        </Link>

        <span
          aria-hidden
          className="mr-4 h-4 w-px bg-border"
        />

        {/* Navigation Links */}
        <nav className="ml-auto flex items-center gap-6">
          {navItems.map((item) => {
            const isActive = currentPath === item.to

            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "group relative flex items-center gap-2 px-1 py-1.5 text-[12px] uppercase tracking-[0.28em] transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-primary"
                )}
              >
                <span className="text-muted-foreground group-hover:text-primary">
                  &gt;
                </span>
                <span>{item.label}</span>
                {isActive && (
                  <span
                    aria-hidden
                    className="absolute inset-x-0 -bottom-[calc(0.5rem+1px)] h-px bg-primary"
                  />
                )}
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
