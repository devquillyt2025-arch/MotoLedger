import type { Ownership } from "@/db/schema";
import { isIsoDate, todayIST } from "./format";

type FieldKind = "text" | "money" | "date" | "select";
export type OwnershipField = { key: string; label: string; kind: FieldKind; placeholder?: string; options?: string[] };

export const OWNERSHIP_GROUPS: { group: string; fields: OwnershipField[] }[] = [
  {
    group: "Purchase",
    fields: [
      { key: "exShowroom", label: "Ex-showroom price", kind: "money", placeholder: "e.g. 230000" },
      { key: "onRoad", label: "On-road price", kind: "money", placeholder: "e.g. 275000" },
      { key: "purchaseDate", label: "Purchase date", kind: "date" },
      { key: "dealer", label: "Dealer", kind: "text", placeholder: "e.g. Sri Bajaj, Bengaluru" },
    ],
  },
  {
    group: "RTO",
    fields: [
      { key: "regNumber", label: "Registration no.", kind: "text", placeholder: "e.g. KA 01 AB 1234" },
      { key: "rtoOffice", label: "RTO office", kind: "text", placeholder: "e.g. KA-01 Koramangala" },
      { key: "regDate", label: "Registration date", kind: "date" },
      { key: "roadTax", label: "Road tax / RTO fees", kind: "money", placeholder: "e.g. 32000" },
      { key: "regValidTill", label: "Registration valid till", kind: "date" },
    ],
  },
  {
    group: "Insurance",
    fields: [
      { key: "insurer", label: "Insurer", kind: "text", placeholder: "e.g. ICICI Lombard" },
      { key: "policyNumber", label: "Policy no.", kind: "text" },
      {
        key: "policyType",
        label: "Policy type",
        kind: "select",
        options: ["Comprehensive", "Third party", "Own damage", "Bumper to bumper"],
      },
      { key: "premium", label: "Premium", kind: "money", placeholder: "e.g. 6200" },
      { key: "idv", label: "IDV (insured value)", kind: "money", placeholder: "e.g. 210000" },
      { key: "insuranceStart", label: "Insurance from", kind: "date" },
      { key: "insuranceExpiry", label: "Insurance expiry", kind: "date" },
      { key: "pucExpiry", label: "PUC expiry", kind: "date" },
    ],
  },
];

const FIELDS = OWNERSHIP_GROUPS.flatMap((g) => g.fields);
const MAX_TEXT = 60;
const MAX_NOTES = 600;

/** Whitelists, trims and validates rider input; empty values are dropped. Null when nothing is left. */
export function parseOwnership(body: unknown): Ownership | null | string {
  if (!body || typeof body !== "object") return "Invalid body";
  const b = body as Record<string, unknown>;
  const out: Ownership = {};
  for (const f of FIELDS) {
    const v = b[f.key] == null ? "" : String(b[f.key]).trim();
    if (!v) continue;
    if (f.kind === "money") {
      const n = Number(v.replace(/[₹,\s]/g, ""));
      if (!Number.isFinite(n) || n < 0 || n >= 100_000_000) return `${f.label} must be an amount in ₹`;
      out[f.key] = String(Math.round(n * 100) / 100);
    } else if (f.kind === "date") {
      if (!isIsoDate(v)) return `${f.label} must be a valid date`;
      out[f.key] = v;
    } else if (f.kind === "select") {
      if (!f.options!.includes(v)) return `Choose a ${f.label.toLowerCase()}`;
      out[f.key] = v;
    } else {
      if (v.length > MAX_TEXT) return `${f.label} is too long`;
      out[f.key] = v;
    }
  }
  const notes = typeof b.notes === "string" ? b.notes.trim() : "";
  if (notes.length > MAX_NOTES) return "Notes are too long";
  if (notes) out.notes = notes;
  if (out.insuranceStart && out.insuranceExpiry && out.insuranceExpiry < out.insuranceStart) {
    return "Insurance expiry is before its start date";
  }
  return Object.keys(out).length ? out : null;
}

export type ExpiryStatus = "expired" | "soon" | "ok";
export type DocExpiry = { key: string; label: string; date: string; daysLeft: number; status: ExpiryStatus };

const DAY_MS = 86_400_000;
const EXPIRY_LABELS: Record<string, string> = {
  insuranceExpiry: "Insurance",
  pucExpiry: "PUC certificate",
  regValidTill: "Registration",
};
/** "Due soon" window for document renewals — insurers allow renewal ~30 days early. */
export const DOC_WARN_DAYS = 30;

/** Insurance / PUC / registration expiries with days left, soonest first. */
export function documentExpiries(o: Ownership | null | undefined, today = todayIST()): DocExpiry[] {
  if (!o) return [];
  return Object.entries(EXPIRY_LABELS)
    .flatMap(([key, label]) => {
      const date = o[key];
      if (!date) return [];
      const daysLeft = Math.round((Date.parse(`${date}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / DAY_MS);
      const status: ExpiryStatus = daysLeft < 0 ? "expired" : daysLeft <= DOC_WARN_DAYS ? "soon" : "ok";
      return [{ key, label, date, daysLeft, status }];
    })
    .sort((a, b) => a.daysLeft - b.daysLeft);
}

/** Purchase + RTO + insurance outlay, for "total cost of ownership". */
export function ownershipCost(o: Ownership | null | undefined) {
  const n = (k: string) => (o?.[k] ? Number(o[k]) : 0);
  // On-road already includes road tax/registration; only add RTO fees separately when on-road is unknown.
  const purchase = n("onRoad") || n("exShowroom") + n("roadTax");
  return { purchase, insurance: n("premium") };
}
