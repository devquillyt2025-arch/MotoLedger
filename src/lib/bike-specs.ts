import type { BikeSpecs, Reminder } from "@/db/schema";
import { REMINDER_HINTS } from "./constants";

/** Rider-editable Bike Info fields for bikes without a built-in manual. All stored as short text. */
export const SPEC_GROUPS: { group: string; fields: { key: string; label: string; placeholder: string; numeric?: boolean }[] }[] = [
  {
    group: "Fuel",
    fields: [
      { key: "tankLitres", label: "Tank capacity (L)", placeholder: "e.g. 12.5", numeric: true },
      { key: "reserve", label: "Reserve / keep at least", placeholder: "e.g. 2.5 L" },
      { key: "fuelType", label: "Petrol", placeholder: "e.g. 91 octane, E20 OK" },
    ],
  },
  {
    group: "Tyres",
    fields: [
      { key: "tyreFront", label: "Front pressure", placeholder: "e.g. 32 PSI" },
      { key: "tyreRear", label: "Rear pressure", placeholder: "e.g. 36 PSI solo · 40 pillion" },
      { key: "tyreSize", label: "Tyre sizes", placeholder: "e.g. 100/90-18 · 130/70-18" },
    ],
  },
  {
    group: "Fluids",
    fields: [
      { key: "engineOil", label: "Engine oil", placeholder: "e.g. 10W-50 JASO MA2" },
      { key: "oilQty", label: "Oil quantity", placeholder: "e.g. 3.1 L with filter" },
      { key: "coolant", label: "Coolant", placeholder: "e.g. none (air/oil cooled)" },
      { key: "brakeFluid", label: "Brake fluid", placeholder: "e.g. DOT-4" },
    ],
  },
  {
    group: "Maintenance",
    fields: [
      { key: "serviceInterval", label: "Service interval", placeholder: "e.g. every 10,000 km or 12 months" },
      { key: "chainSlack", label: "Chain slack", placeholder: "e.g. 20–30 mm" },
      { key: "sparkPlug", label: "Spark plug", placeholder: "e.g. gap 0.8 mm" },
      { key: "battery", label: "Battery", placeholder: "e.g. 12V 8Ah" },
    ],
  },
];

export const SPEC_KEYS = SPEC_GROUPS.flatMap((g) => g.fields.map((f) => f.key)).concat("notes");
const MAX_LEN = 80;
const MAX_NOTES = 600;

/** Whitelists and trims rider input. Empty values are dropped; returns null when nothing is left. */
export function parseSpecs(body: unknown): BikeSpecs | null | string {
  if (!body || typeof body !== "object") return "Invalid body";
  const out: BikeSpecs = {};
  for (const key of SPEC_KEYS) {
    const raw = (body as Record<string, unknown>)[key];
    if (raw == null) continue;
    const v = String(raw).trim();
    if (!v) continue;
    if (v.length > (key === "notes" ? MAX_NOTES : MAX_LEN)) return `${key === "notes" ? "Notes" : "Each field"} is too long`;
    if (key === "tankLitres") {
      const n = Number(v);
      if (!Number.isFinite(n) || n <= 0 || n > 50) return "Tank capacity must be a number of litres (1–50)";
    }
    out[key] = v;
  }
  return Object.keys(out).length ? out : null;
}

/** Tank size for the litres warning: rider-entered, else the Dominar's 13 L, else unknown. */
export function tankLitresFor(bike: string, specs: BikeSpecs | null | undefined): number | null {
  if (specs?.tankLitres) return Number(specs.tankLitres);
  return /dominar/i.test(bike) ? 13 : null;
}

/** One-line "how / what" for a reminder card, specific to this profile's bike (or nothing if unknown). */
export function reminderHint(type: Reminder["type"], bike: string, specs: BikeSpecs | null | undefined): string | null {
  if (/dominar/i.test(bike)) return REMINDER_HINTS[type];
  const s = specs ?? {};
  const join = (...parts: (string | false | undefined)[]) => parts.filter(Boolean).join(" · ") || null;
  switch (type) {
    case "tyre_pressure":
      return join(s.tyreFront && `Front ${s.tyreFront}`, s.tyreRear && `Rear ${s.tyreRear}`);
    case "oil_change":
      return join(s.engineOil, s.oilQty);
    case "chain_lube":
      return join(s.chainSlack && `Chain slack ${s.chainSlack}`);
    case "service":
      return join(s.serviceInterval && `Service ${s.serviceInterval}`);
    case "coolant_change":
      return join(s.coolant);
    case "accessory_charge":
      return join(s.battery);
  }
}
