import type { EntryType } from "@/db/schema";

export const FUEL_PRICE_PER_LITRE = 102;

export const CATEGORY_SUGGESTIONS: Record<EntryType, string[]> = {
  refuel: ["Regular Refill", "Full Tank", "Reserve Refill"],
  service: ["1st Service", "2nd Service", "3rd Service", "General Service", "Repair"],
  accessory: ["Helmet", "Battery", "Chain Lube Spray", "Riding Gear", "Other"],
};

export const DEFAULT_REMINDERS = [
  { type: "chain_lube", label: "Chain Lube", intervalKm: 500, intervalDays: 15 },
  { type: "service", label: "Full Service", intervalKm: 3000, intervalDays: 90 },
  { type: "accessory_charge", label: "Battery Charge", intervalKm: null, intervalDays: 30 },
] as const;

// "Upcoming" (yellow) when within these thresholds of due.
export const WARN_DAYS = 3;
export const WARN_KM = 50;
