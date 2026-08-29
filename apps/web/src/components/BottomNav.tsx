import { Link, useRouterState } from "@tanstack/react-router";
import { CalendarCheck, Compass, Plus, UserRound, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useApp } from "@/lib/store";

const tabs = [
  { to: "/", label: "Discover", icon: Compass },
  { to: "/people", label: "People", icon: Users },
  { to: "/going", label: "Going", icon: CalendarCheck },
  { to: "/create", label: "Create", icon: Plus, fab: true },
  { to: "/you", label: "You", icon: UserRound },
] as const;

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { unreadThreads, incomingRequests } = useApp();
  const badge = unreadThreads.length + incomingRequests.length;

  return (
    <nav className="fixed bottom-0 left-1/2 z-50 w-full max-w-md -translate-x-1/2 border-t border-border bg-background/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl">
      <div className="grid grid-cols-5 px-2 py-2">
        {tabs.map((tab) => {
          const active = tab.to === "/" ? pathname === "/" : pathname.startsWith(tab.to);
          if ("fab" in tab && tab.fab) {
            return (
              <Link key={tab.to} to={tab.to} className="flex flex-col items-center gap-0.5">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-brand shadow-glow transition-transform active:scale-95">
                  <tab.icon className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
                </span>
                <span
                  className={cn(
                    "text-[10px] font-semibold",
                    active ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {tab.label}
                </span>
              </Link>
            );
          }
          return (
            <Link
              key={tab.to}
              to={tab.to}
              className="relative flex flex-col items-center gap-0.5 py-1"
            >
              {tab.to === "/you" && badge > 0 && (
                <span
                  aria-label={`${badge} unread`}
                  className="absolute right-[26%] top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground"
                >
                  {badge}
                </span>
              )}
              <tab.icon
                className={cn("h-5 w-5", active ? "text-primary" : "text-muted-foreground")}
                strokeWidth={active ? 2.5 : 2}
              />
              <span
                className={cn(
                  "text-[10px] font-semibold",
                  active ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
