/* ------------------------------------------------------------------
   Payments layer — DEMO ONLY.
   No card is ever charged, nothing leaves the device. This models the
   shape a real processor integration would take (methods, authorisation,
   receipts) so the flows can be swapped for a live PSP later.
------------------------------------------------------------------- */

export type CardBrand = "visa" | "mastercard" | "amex" | "card";
export type MethodKind = "card" | "applepay" | "googlepay";

export interface PaymentMethod {
  id: string;
  kind: MethodKind;
  brand: CardBrand;
  last4: string;
  expiry: string;
  label: string;
}

export const seedMethods: PaymentMethod[] = [
  {
    id: "pm-apple",
    kind: "applepay",
    brand: "card",
    last4: "4242",
    expiry: "",
    label: "Apple Pay",
  },
  {
    id: "pm-visa",
    kind: "card",
    brand: "visa",
    last4: "4242",
    expiry: "04/29",
    label: "Visa",
  },
];

export function brandOf(number: string): CardBrand {
  const n = number.replace(/\D/g, "");
  if (n.startsWith("4")) return "visa";
  if (/^5[1-5]/.test(n) || /^2[2-7]/.test(n)) return "mastercard";
  if (/^3[47]/.test(n)) return "amex";
  return "card";
}

export function brandLabel(brand: CardBrand): string {
  return brand === "visa"
    ? "Visa"
    : brand === "mastercard"
      ? "Mastercard"
      : brand === "amex"
        ? "Amex"
        : "Card";
}

export function formatCardNumber(v: string): string {
  const n = v.replace(/\D/g, "").slice(0, 16);
  return n.replace(/(.{4})/g, "$1 ").trim();
}

export function formatExpiry(v: string): string {
  const n = v.replace(/\D/g, "").slice(0, 4);
  if (n.length <= 2) return n;
  return `${n.slice(0, 2)}/${n.slice(2)}`;
}

export interface CardDraft {
  number: string;
  expiry: string;
  cvc: string;
  name: string;
  postcode: string;
}

export function validateCard(d: CardDraft): string | null {
  const n = d.number.replace(/\D/g, "");
  if (n.length < 15) return "Card number looks short";
  const [mm, yy] = d.expiry.split("/");
  if (!mm || !yy || Number(mm) < 1 || Number(mm) > 12) return "Check the expiry date";
  if (d.cvc.replace(/\D/g, "").length < 3) return "Check the security code";
  if (!d.name.trim()) return "Add the name on the card";
  return null;
}

export function methodFromDraft(d: CardDraft): PaymentMethod {
  const brand = brandOf(d.number);
  return {
    id: `pm-${Date.now()}`,
    kind: "card",
    brand,
    last4: d.number.replace(/\D/g, "").slice(-4),
    expiry: d.expiry,
    label: brandLabel(brand),
  };
}

/** Stages a real authorisation would move through — used to pace the demo. */
export const AUTH_STAGES = [
  { id: "auth", label: "Authorising with your bank" },
  { id: "verify", label: "Confirming with the host" },
  { id: "issue", label: "Issuing your ticket" },
] as const;

export interface Receipt {
  id: string;
  title: string;
  sub: string;
  amount: number; // pence, negative = refund
  when: string;
  kind: "ticket" | "membership" | "drop" | "refund";
}
