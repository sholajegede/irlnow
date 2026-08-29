import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { QrCode } from "@/components/QrCode";
import { absoluteUrl } from "@/config/app";
import { decodeQrSvg } from "../helpers/decode-qr";

/**
 * These codes are printed on signage and shown at venue doors. A code that
 * renders but does not scan fails silently in the one place nobody can debug
 * it, so every test here decodes the rendered output rather than asserting on
 * the markup.
 */
describe("QrCode", () => {
  function renderAndDecode(value: string): string | null {
    const { container } = render(<QrCode value={value} />);
    const svg = container.querySelector("svg");
    expect(svg, "component rendered no svg").not.toBeNull();
    return decodeQrSvg(svg as SVGSVGElement);
  }

  it("encodes the value it is given", () => {
    const url = "https://irlnow.app/e/jazz-late";
    expect(renderAndDecode(url)).toBe(url);
  });

  it("encodes a check-in URL built from app config", () => {
    const url = absoluteUrl("/e/rooftop-golden-hour");
    expect(renderAndDecode(url)).toBe(url);
  });

  it("encodes a ticket URL with a door code", () => {
    const url = absoluteUrl("/t/supper-club/QK-4821");
    expect(renderAndDecode(url)).toBe(url);
  });

  it("produces different codes for different events", () => {
    const first = renderAndDecode(absoluteUrl("/e/jazz-late"));
    const second = renderAndDecode(absoluteUrl("/e/sunrise-run"));
    expect(first).not.toBe(second);
  });

  it("survives a long URL, which forces a larger QR version", () => {
    const url = absoluteUrl(`/e/${"a-very-long-event-slug".repeat(4)}?ref=door-signage`);
    expect(renderAndDecode(url)).toBe(url);
  });

  it("describes where the code leads, for screen readers", () => {
    render(
      <QrCode value="https://irlnow.app/e/jazz-late" label="QR code to check in at Jazz Late" />,
    );
    expect(
      screen.getByRole("img", { name: "QR code to check in at Jazz Late" }),
    ).toBeInTheDocument();
  });

  it("falls back to naming the destination when no label is given", () => {
    render(<QrCode value="https://irlnow.app/e/jazz-late" />);
    expect(
      screen.getByRole("img", { name: "QR code linking to https://irlnow.app/e/jazz-late" }),
    ).toBeInTheDocument();
  });
});
