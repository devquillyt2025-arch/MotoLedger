import type { EntryType, Reminder } from "@/db/schema";

/** Default petrol price (₹/L) for profiles that haven't set their own. */
export const FUEL_PRICE_PER_LITRE = 110.1;

/** Dominar 400 tank: 13 L with no reserve; the manual says never run below 3 L (fuel pump). */
export const TANK_LITRES = 13;
export const MIN_FUEL_LITRES = 3;

export const CATEGORY_SUGGESTIONS: Record<EntryType, string[]> = {
  refuel: ["Regular Refill", "Full Tank", "Reserve Refill"],
  service: ["1st Service", "2nd Service", "3rd Service", "Paid Service", "Repair"],
  accessory: ["Helmet", "Battery", "Chain Lube Spray", "Riding Gear", "Other"],
};

// Intervals from the Dominar 400 owner's manual (periodic maintenance chart).
export const DEFAULT_REMINDERS = [
  { type: "chain_lube", label: "Chain Lube", intervalKm: 500, intervalDays: 15 },
  { type: "service", label: "Full Service", intervalKm: 5000, intervalDays: 120 },
  { type: "accessory_charge", label: "Battery Charge", intervalKm: null, intervalDays: 30 },
  { type: "oil_change", label: "Engine Oil Change", intervalKm: 10000, intervalDays: null },
  { type: "tyre_pressure", label: "Tyre Pressure", intervalKm: null, intervalDays: 7 },
  { type: "coolant_change", label: "Coolant Replace", intervalKm: 30000, intervalDays: 1095 },
] as const;

/** One-line "how / what" from the manual, shown on each reminder card. */
export const REMINDER_HINTS: Record<Reminder["type"], string> = {
  chain_lube: "O-ring chain: Bajaj/OKS chain lube spray every 500 km. Slack 20–30 mm.",
  service: "Free: 500–750 km, 4,500–5,000 km, 9,500–10,000 km. Then paid every 5,000 km or 120 days.",
  accessory_charge: "12V 8Ah VRLA — no topping-up. Disconnect if parked over 2 weeks.",
  oil_change: "Bajaj 10000 10W-50 fully synthetic, 1.7 L. Top-up at 5,000 km, change at 10,000 km.",
  tyre_pressure: "Front 29 PSI · Rear 32 PSI (solo and with pillion).",
  coolant_change: "Bajaj Koolex only, 1 L total. Replace every 30,000 km or 3 years.",
};

// "Upcoming" (yellow) when within these thresholds of due.
export const WARN_DAYS = 3;
export const WARN_KM = 50;
