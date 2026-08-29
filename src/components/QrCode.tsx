import { cn } from "@/lib/utils";

/** Deterministic decorative QR-style matrix for the prototype. */
function hash(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function QrCode({ value, className }: { value: string; className?: string }) {
  const size = 21;
  const seed = hash(value);
  const cells: boolean[] = [];
  let state = seed || 1;
  for (let i = 0; i < size * size; i++) {
    state = (state * 1664525 + 1013904223) >>> 0;
    cells.push(((state >>> 16) & 1) === 1);
  }

  const isFinder = (r: number, c: number) => {
    const inBox = (br: number, bc: number) => r >= br && r < br + 7 && c >= bc && c < bc + 7;
    return inBox(0, 0) || inBox(0, size - 7) || inBox(size - 7, 0);
  };
  const finderOn = (r: number, c: number) => {
    const lr = r < 7 ? r : r - (size - 7);
    const lc = c < 7 ? c : c - (size - 7);
    const ring = Math.max(Math.abs(lr - 3), Math.abs(lc - 3));
    return ring !== 2;
  };

  return (
    <div
      className={cn("grid aspect-square w-full gap-0 rounded-2xl bg-white p-3", className)}
      role="img"
      aria-label={`QR code for ${value}`}
    >
      <div
        className="grid h-full w-full"
        style={{
          gridTemplateColumns: `repeat(${size}, 1fr)`,
          gridTemplateRows: `repeat(${size}, 1fr)`,
        }}
      >
        {Array.from({ length: size * size }).map((_, i) => {
          const r = Math.floor(i / size);
          const c = i % size;
          const on = isFinder(r, c) ? finderOn(r, c) : cells[i]!;
          return <div key={i} className={on ? "bg-[#0b0710]" : "bg-white"} />;
        })}
      </div>
    </div>
  );
}
