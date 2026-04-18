import { Link, useRouterState } from "@tanstack/react-router"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

const navItems = [
  { label: "Configure", to: "/configure" as const },
  { label: "Chat", to: "/chat" as const },
]

export function TopNav() {
  const routerState = useRouterState()
  const currentPath = routerState.location.pathname

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="flex h-14 items-center px-6">
        {/* Logo / Avatar */}
        <Link to="/" className="mr-4 flex items-center">
          <Avatar size="sm">
            <AvatarImage src="/favicon.svg" alt="Logo" />
            <AvatarFallback>CH</AvatarFallback>
          </Avatar>
        </Link>

        <Separator orientation="vertical" className="mr-4 h-5" />

        {/* Navigation Links */}
        <nav className="ml-auto flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = currentPath === item.to

            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "relative px-4 py-1.5 text-sm font-medium transition-colors",
                  "rounded-md hover:bg-accent hover:text-accent-foreground",
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground"
                )}
              >
                {item.label}
                {isActive && (
                  <span className="absolute inset-x-1 -bottom-[calc(0.5rem+1px)] h-0.5 rounded-full bg-foreground" />
                )}
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
