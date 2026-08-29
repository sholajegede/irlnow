import jsQR from "jsqr";

/**
 * Decode a rendered QR SVG back into the text it encodes.
 *
 * The point of this helper is that it does not trust the component's own
 * representation of the code: it reads the DOM the browser would paint, turns
 * it into a bitmap, and hands that to a scanner. A test using it fails for the
 * same reason a phone camera would.
 */
export function decodeQrSvg(svg: SVGSVGElement): string | null {
  const size = moduleCount(svg);
  const grid = readModules(svg, size);

  // Scanners need the quiet zone the spec requires (4 modules) and more than
  // one pixel per module to lock on.
  const QUIET = 4;
  const SCALE = 4;
  const dim = (size + QUIET * 2) * SCALE;

  const data = new Uint8ClampedArray(dim * dim * 4).fill(255);
  for (let y = 0; y < dim; y++) {
    for (let x = 0; x < dim; x++) {
      const mx = Math.floor(x / SCALE) - QUIET;
      const my = Math.floor(y / SCALE) - QUIET;
      const inside = mx >= 0 && my >= 0 && mx < size && my < size;
      if (!inside || !grid[my]?.[mx]) continue;
      const offset = (y * dim + x) * 4;
      data[offset] = 0;
      data[offset + 1] = 0;
      data[offset + 2] = 0;
    }
  }

  return jsQR(data, dim, dim)?.data ?? null;
}

function moduleCount(svg: SVGSVGElement): number {
  const viewBox = svg.getAttribute("viewBox");
  const size = viewBox ? Number(viewBox.split(/\s+/)[2]) : NaN;
  if (!Number.isFinite(size) || size <= 0) {
    throw new Error(`QR svg has no usable viewBox (got ${viewBox ?? "none"})`);
  }
  return size;
}

/**
 * Rebuild the module grid from the dark path's run-lengths.
 *
 * qrcode.react emits one horizontal run per segment as `M<x> <y>h<w>v1H<x>z`,
 * sometimes with a comma separator and a space before the `h`.
 */
function readModules(svg: SVGSVGElement, size: number): Uint8Array[] {
  const paths = Array.from(svg.querySelectorAll("path"));
  // The first path is the light background; the dark modules are the rest.
  const darkPath = paths.at(-1)?.getAttribute("d");
  if (!darkPath) throw new Error("QR svg contains no module path");

  const grid = Array.from({ length: size }, () => new Uint8Array(size));
  for (const match of darkPath.matchAll(/M(\d+)[ ,](\d+)\s*h(\d+)v1H\d+/g)) {
    const x = Number(match[1]);
    const y = Number(match[2]);
    const width = Number(match[3]);
    for (let i = 0; i < width; i++) {
      const row = grid[y];
      if (row && x + i < size) row[x + i] = 1;
    }
  }
  return grid;
}
