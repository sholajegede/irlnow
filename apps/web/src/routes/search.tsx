import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  MapPin,
  Search as SearchIcon,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { Avatar, AvatarStack } from "@/components/Avatar";
import { BottomNav } from "@/components/BottomNav";
import {
  categories,
  events,
  filterEvents,
  peopleByIds,
  searchEvents,
  searchOrganisers,
  searchPeople,
  searchPlaces,
  type FeedFilters,
} from "@irlnow/domain";
import { eventCovers } from "@/lib/covers";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/search")({
  head: () => ({
    meta: [
      { title: "Search — IRL NOW" },
      {
        name: "description",
        content:
          "Search events, people, places and organisers across London. Filter by when, category, distance and price.",
      },
      { property: "og:title", content: "Search — IRL NOW" },
      { property: "og:description", content: "Find exactly what you're looking for." },
    ],
  }),
  component: SearchPage,
});

const quickSearches = ["Supper club", "Jazz", "Free tonight", "Peckham", "Run", "Rooftop"];

function SearchPage() {
  const [q, setQ] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FeedFilters>({ when: "any", categories: [] });

  const activeFilterCount =
    (filters.when && filters.when !== "any" ? 1 : 0) +
    (filters.categories?.length ?? 0) +
    (filters.maxDistanceKm != null ? 1 : 0) +
    (filters.freeOnly ? 1 : 0) +
    (filters.hasSpots ? 1 : 0);

  const eventResults = useMemo(() => {
    const base = q.trim() ? searchEvents(q) : events;
    return filterEvents(base, filters);
  }, [q, filters]);

  const personResults = useMemo(() => searchPeople(q), [q]);
  const organiserResults = useMemo(() => searchOrganisers(q), [q]);
  const placeResults = useMemo(() => searchPlaces(q), [q]);

  const toggleCategory = (c: string) =>
    setFilters((f) => {
      const cur = f.categories ?? [];
      return { ...f, categories: cur.includes(c) ? cur.filter((x) => x !== c) : [...cur, c] };
    });

  return (
    <div className="flex min-h-dvh flex-col pb-24">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/90 px-4 py-3 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <Link to="/" className="rounded-full p-1.5 active:bg-secondary">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex flex-1 items-center gap-2 rounded-full bg-secondary px-3.5 py-2.5">
            <SearchIcon className="h-4 w-4 text-muted-foreground" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Events, people, places, organisers"
              className="w-full bg-transparent text-sm font-medium outline-none placeholder:text-muted-foreground"
            />
            {q && (
              <button onClick={() => setQ("")} aria-label="Clear search">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters((s) => !s)}
            aria-label="Filters"
            className={cn(
              "relative rounded-full p-2.5",
              showFilters || activeFilterCount
                ? "bg-primary text-primary-foreground"
                : "bg-secondary",
            )}
          >
            <SlidersHorizontal className="h-4 w-4" />
            {activeFilterCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {showFilters && (
          <div className="animate-fade-up space-y-3 pt-3">
            <FilterRow label="When">
              {(["any", "tonight", "weekend"] as const).map((w) => (
                <Chip
                  key={w}
                  active={(filters.when ?? "any") === w}
                  onClick={() => setFilters((f) => ({ ...f, when: w }))}
                >
                  {w === "any" ? "Any time" : w === "tonight" ? "Tonight" : "This weekend"}
                </Chip>
              ))}
            </FilterRow>
            <FilterRow label="Category">
              {categories.map((c) => (
                <Chip
                  key={c}
                  active={filters.categories?.includes(c) ?? false}
                  onClick={() => toggleCategory(c)}
                >
                  {c}
                </Chip>
              ))}
            </FilterRow>
            <FilterRow label="Distance">
              {[2, 4, 6].map((d) => (
                <Chip
                  key={d}
                  active={filters.maxDistanceKm === d}
                  onClick={() =>
                    setFilters((f) => ({
                      ...f,
                      maxDistanceKm: f.maxDistanceKm === d ? undefined : d,
                    }))
                  }
                >
                  Within {d} km
                </Chip>
              ))}
            </FilterRow>
            <FilterRow label="More">
              <Chip
                active={!!filters.freeOnly}
                onClick={() => setFilters((f) => ({ ...f, freeOnly: !f.freeOnly }))}
              >
                Free
              </Chip>
              <Chip
                active={!!filters.hasSpots}
                onClick={() => setFilters((f) => ({ ...f, hasSpots: !f.hasSpots }))}
              >
                Spots left
              </Chip>
              {activeFilterCount > 0 && (
                <button
                  onClick={() => setFilters({ when: "any", categories: [] })}
                  className="shrink-0 px-2 text-xs font-bold text-primary"
                >
                  Clear all
                </button>
              )}
            </FilterRow>
          </div>
        )}
      </header>

      <main className="flex-1 px-4 pt-4">
        {!q && (
          <div className="pb-4">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Try</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {quickSearches.map((s) => (
                <button
                  key={s}
                  onClick={() => setQ(s)}
                  className="rounded-full bg-secondary px-3.5 py-1.5 text-xs font-bold"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {placeResults.length > 0 && (
          <Section title="Places">
            {placeResults.map((p) => (
              <div
                key={p.area}
                className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary">
                  <MapPin className="h-4 w-4 text-primary" />
                </span>
                <div>
                  <p className="font-display text-base font-bold">{p.area}</p>
                  <p className="text-xs text-muted-foreground">{p.count} events on</p>
                </div>
              </div>
            ))}
          </Section>
        )}

        <Section title={q ? "Events" : `${eventResults.length} events`}>
          {eventResults.map((e) => (
            <Link
              key={e.id}
              to="/event/$id"
              params={{ id: e.id }}
              className="flex gap-3 rounded-2xl border border-border bg-card p-3 active:scale-[0.99]"
            >
              <img
                src={eventCovers[e.cover]}
                alt={e.title}
                width={160}
                height={200}
                loading="lazy"
                className="h-20 w-16 shrink-0 rounded-xl object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-base font-bold">{e.title}</p>
                <p className="text-xs text-muted-foreground">
                  {e.dateLabel} · {e.area} · {e.price}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <AvatarStack people={peopleByIds(e.going)} />
                  <span className="text-xs font-medium text-muted-foreground">
                    {e.goingCount} going
                  </span>
                </div>
              </div>
            </Link>
          ))}
          {eventResults.length === 0 && (
            <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              Nothing matches. Try fewer filters.
            </p>
          )}
        </Section>

        {organiserResults.length > 0 && (
          <Section title="Organisers">
            {organiserResults.map((o) => (
              <Link
                key={o.id}
                to="/organiser/$id"
                params={{ id: o.id }}
                className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3"
              >
                <Avatar person={{ name: o.name, avatar: o.avatar }} />
                <div className="min-w-0">
                  <p className="flex items-center gap-1 font-display text-base font-bold">
                    {o.name}
                    {o.verified && <BadgeCheck className="h-4 w-4 text-accent" />}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{o.blurb}</p>
                </div>
              </Link>
            ))}
          </Section>
        )}

        {personResults.length > 0 && (
          <Section title="People">
            {personResults.map((p) => (
              <Link
                key={p.id}
                to="/person/$id"
                params={{ id: p.id }}
                className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3"
              >
                <Avatar person={p} />
                <div className="min-w-0">
                  <p className="font-display text-base font-bold">{p.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{p.bio}</p>
                </div>
              </Link>
            ))}
          </Section>
        )}
      </main>
      <BottomNav />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="pb-6">
      <h2 className="pb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
        {title}
      </h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="pb-1.5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <div className="flex gap-2 overflow-x-auto no-scrollbar">{children}</div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all active:scale-95",
        active ? "bg-foreground text-background" : "bg-secondary text-secondary-foreground",
      )}
    >
      {children}
    </button>
  );
}
