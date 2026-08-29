import { QRCodeSVG } from "qrcode.react";
import { cn } from "@/lib/utils";

/** Matches the `--background` end of the palette so codes sit in the brand. */
const MODULE_COLOUR = "#0b0710";

interface QrCodeProps {
  /** The value encoded in the code. Pass an absolute URL so a phone camera can open it. */
  value: string;
  /** Human-readable description of where the code leads, for screen readers. */
  label?: string;
  className?: string;
}

/**
 * A scannable QR code.
 *
 * Error correction is set to "M" (~15% recoverable), which survives the two
 * realistic hazards for these codes: a printed sign that picks up wear at a
 * venue door, and a screen photographed at an angle in low light.
 */
export function QrCode({ value, label, className }: QrCodeProps) {
  return (
    <div
      className={cn(
        "flex aspect-square w-full items-center justify-center rounded-2xl bg-white p-3",
        className,
      )}
      role="img"
      aria-label={label ?? `QR code linking to ${value}`}
    >
      <QRCodeSVG
        value={value}
        level="M"
        marginSize={0}
        bgColor="#ffffff"
        fgColor={MODULE_COLOUR}
        className="h-full w-full"
        // The SVG carries the meaning through the wrapper's aria-label.
        aria-hidden="true"
      />
    </div>
  );
}
