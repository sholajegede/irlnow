import type { Person } from "@/lib/data";
import { cn } from "@/lib/utils";

export function Avatar({
  person,
  size = "md",
  className,
}: {
  person: Pick<Person, "name" | "avatar">;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const sizes = {
    sm: "h-7 w-7 text-[10px]",
    md: "h-10 w-10 text-xs",
    lg: "h-14 w-14 text-base",
    xl: "h-20 w-20 text-2xl",
  };
  const initials = person.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-bold text-primary-foreground ring-2 ring-background",
        `avatar-${person.avatar}`,
        sizes[size],
        className,
      )}
      aria-label={person.name}
    >
      {initials}
    </div>
  );
}

export function AvatarStack({ people, max = 3 }: { people: Person[]; max?: number }) {
  return (
    <div className="flex -space-x-2.5">
      {people.slice(0, max).map((p) => (
        <Avatar key={p.id} person={p} size="sm" />
      ))}
    </div>
  );
}
