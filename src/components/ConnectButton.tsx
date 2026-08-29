import { Check, Clock, MessageCircle, UserPlus, X } from "lucide-react";
import { Link } from "@tanstack/react-router";
import type { Person } from "@/lib/data";
import { useApp, useConnectionState } from "@/lib/store";
import { cn } from "@/lib/utils";

/**
 * Real connection-request lifecycle: none -> requested -> connected.
 * Messaging only unlocks once a connection is accepted.
 */
export function ConnectButton({
  person,
  size = "lg",
}: {
  person: Pick<Person, "id" | "name">;
  size?: "sm" | "lg";
}) {
  const { requestConnection, cancelRequest, acceptRequest, declineRequest } = useApp();
  const state = useConnectionState(person.id);
  const base = cn(
    "flex items-center justify-center gap-2 rounded-2xl font-display font-bold transition-all active:scale-[0.98]",
    size === "lg" ? "h-12 w-full text-base" : "h-9 px-3.5 text-xs",
  );

  if (state === "blocked") {
    return <span className={cn(base, "bg-secondary text-muted-foreground")}>Blocked</span>;
  }

  if (state === "connected") {
    return (
      <Link
        to="/dm/$id"
        params={{ id: person.id }}
        className={cn(base, "bg-accent text-accent-foreground")}
      >
        <MessageCircle className={size === "lg" ? "h-5 w-5" : "h-4 w-4"} />
        Message
      </Link>
    );
  }

  if (state === "requested") {
    return (
      <button
        onClick={() => cancelRequest(person.id)}
        className={cn(base, "bg-secondary text-secondary-foreground")}
      >
        <Clock className={size === "lg" ? "h-5 w-5" : "h-4 w-4"} />
        Requested
      </button>
    );
  }

  if (state === "incoming") {
    return (
      <div className={cn("flex gap-2", size === "lg" && "w-full")}>
        <button
          onClick={() => acceptRequest(person.id)}
          className={cn(base, "flex-1 bg-gradient-brand text-primary-foreground shadow-glow")}
        >
          <Check className={size === "lg" ? "h-5 w-5" : "h-4 w-4"} strokeWidth={3} />
          Accept
        </button>
        <button
          onClick={() => declineRequest(person.id)}
          aria-label={`Decline ${person.name}`}
          className={cn(
            "flex items-center justify-center rounded-2xl bg-secondary text-muted-foreground",
            size === "lg" ? "h-12 w-12" : "h-9 w-9",
          )}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => requestConnection(person.id)}
      className={cn(base, "bg-gradient-brand text-primary-foreground shadow-glow")}
    >
      <UserPlus className={size === "lg" ? "h-5 w-5" : "h-4 w-4"} />
      {size === "lg" ? `Connect with ${person.name}` : "Connect"}
    </button>
  );
}
