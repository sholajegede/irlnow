import { Link } from "@tanstack/react-router";
import type { ComponentType, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * First-run and zero-data surface. Every empty state names one action —
 * launch testers churn on screens that just say "nothing here".
 */
export function EmptyState({
  icon: Icon,
  title,
  body,
  action,
  actionTo,
  secondary,
  secondaryTo,
  children,
  className,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  body: string;
  action?: string;
  actionTo?: string;
  secondary?: string;
  secondaryTo?: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center gap-3 px-8 py-14 text-center", className)}>
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary">
        <Icon className="h-7 w-7 text-primary" />
      </span>
      <h2 className="font-display text-xl font-extrabold">{title}</h2>
      <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">{body}</p>
      {action && actionTo && (
        <Link
          to={actionTo}
          className="mt-2 rounded-2xl bg-gradient-brand px-6 py-3.5 font-display text-sm font-bold text-primary-foreground shadow-glow"
        >
          {action}
        </Link>
      )}
      {secondary && secondaryTo && (
        <Link to={secondaryTo} className="text-xs font-bold text-primary">
          {secondary}
        </Link>
      )}
      {children}
    </div>
  );
}
