import { Bell, Map, MapPin, Search } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useApp } from "@/lib/store";
import { Avatar } from "./Avatar";

export function AppHeader({ title, actions = false }: { title?: string; actions?: boolean }) {
  const { city, name, onboarded, incomingRequests, readNotificationIds } = useApp();
  const hasUnread = incomingRequests.some((id) => !readNotificationIds.includes(`req-${id}`)) ||
    !readNotificationIds.includes("wall-supper");
  return (
    <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border/60 bg-background/85 px-4 py-3 backdrop-blur-xl">
      <div>
        <Link to="/" className="font-display text-lg font-extrabold tracking-tight">
          IRL<span className="text-primary">·</span>NOW
        </Link>
        {title ? (
          <p className="text-xs font-medium text-muted-foreground">{title}</p>
        ) : (
          <p className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
            <MapPin className="h-3 w-3 text-primary" /> {city}
          </p>
        )}
      </div>
      <div className="flex items-center gap-1.5">
        {actions && (
          <>
            <Link to="/search" aria-label="Search" className="rounded-full bg-secondary p-2 active:scale-95">
              <Search className="h-4 w-4" />
            </Link>
            <Link to="/map" aria-label="Map view" className="rounded-full bg-secondary p-2 active:scale-95">
              <Map className="h-4 w-4" />
            </Link>
          </>
        )}
        <Link
          to="/notifications"
          aria-label="Notifications"
          className="relative rounded-full bg-secondary p-2 active:scale-95"
        >
          <Bell className="h-4 w-4" />
          {hasUnread && (
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary ring-2 ring-background" />
          )}
        </Link>
        <Link to={onboarded ? "/you" : "/onboard"}>
          <Avatar person={{ name: onboarded && name ? name : "You", avatar: 3 }} size="sm" />
        </Link>
      </div>
    </header>
  );
}
