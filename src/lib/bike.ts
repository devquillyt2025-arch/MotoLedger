// Reference data from the Bajaj Dominar 400 BS VI owner's manual (Doc 71120259, Rev 00, Mar 2026).

export const BIKE_NAME = "Bajaj Dominar 400";

export const SPECS: { group: string; items: [string, string][] }[] = [
  {
    group: "Fuel",
    items: [
      ["Tank capacity", "13 L (no reserve)"],
      ["Keep at least", "3 L in the tank"],
      ["Petrol", "91 octane · E20 / E10 OK"],
    ],
  },
  {
    group: "Tyres",
    items: [
      ["Front pressure", "29 PSI (2.04 kgf/cm²)"],
      ["Rear pressure", "32 PSI solo & pillion"],
      ["Front / Rear size", "110/70-R17 · 150/60-R17"],
      ["Puncture", "Plug / filler method only — no patch"],
    ],
  },
  {
    group: "Fluids",
    items: [
      ["Engine oil", "Bajaj 10000 10W-50 · JASO MA2 API SN"],
      ["Oil qty", "1.7 L at service · 1.95 L overhaul"],
      ["Coolant", "Bajaj Koolex · 1 L total"],
      ["Brake fluid", "DOT-4, sealed container only"],
    ],
  },
  {
    group: "Adjustments",
    items: [
      ["Chain slack", "20–30 mm"],
      ["Clutch lever play", "3 mm"],
      ["Spark plug gap", "0.8–0.9 mm"],
      ["Battery", "12V 8Ah VRLA, under rider seat"],
    ],
  },
];

/** Free services: whichever of days-from-purchase or km comes first. */
export const FREE_SERVICES = [
  { n: 1, label: "1st Free Service", days: "30–45 days", km: "500–750 km", maxKm: 750 },
  { n: 2, label: "2nd Free Service", days: "240 days", km: "4,500–5,000 km", maxKm: 5000 },
  { n: 3, label: "3rd Free Service", days: "360 days", km: "9,500–10,000 km", maxKm: 10000 },
];

export const PAID_SERVICE_RULE = "Every 5,000 km or 120 days after the previous service, whichever is earlier";

/** Major items from the periodic maintenance chart that cost money or matter most. */
export const MAJOR_ITEMS: [string, string][] = [
  ["Engine oil", "Replace at 1st service, then every 10,000 km · top-up every 5,000 km"],
  ["Oil filter", "Replace at 1st service, then every 10,000 km"],
  ["Spark plug", "Clean every 10,000 km · replace every 30,000 km"],
  ["Air filter", "Replace every 20,000 km"],
  ["Valve clearance", "Check & adjust every 20,000 km"],
  ["Brake pads", "Replace every 15,000 km (check every service)"],
  ["Brake fluid & seals", "Replace every 30,000 km"],
  ["Front fork oil & seals", "Replace every 30,000 km"],
  ["Coolant & radiator hoses", "Replace every 30,000 km or 3 years"],
  ["Water pump seals", "Replace every 40,000 km"],
  ["Throttle body", "Clean every 5,000 km"],
];

export const RUNNING_IN = {
  limitKm: 2000,
  rows: [
    { range: "0–1,000 km", speeds: [10, 20, 30, 40, 50, 60] },
    { range: "1,000–2,000 km", speeds: [20, 30, 40, 50, 60, 70] },
  ],
};

export const DAILY_CHECKS = [
  "Enough fuel for the trip (keep 3 L minimum), no leaks",
  "Engine oil between upper and lower mark (bike upright, engine cold)",
  "Coolant between MIN and MAX in the expansion tank",
  "Front & rear brake fluid above MIN",
  "Chain slack 20–30 mm and lubricated",
  "Tyre pressure 29 / 32 PSI, no cuts, enough tread",
  "All lights & horn working, mirrors adjusted",
  "Clutch play 3 mm, steering moves freely, side stand returns fully",
];

export const WARRANTY = {
  vehicle: "5 years or 75,000 km from sale (first owner only)",
  battery: "18 months from purchase",
  conditions: [
    "All 3 free services availed on time",
    "Paid services every 5,000 km or 120 days — no lapse",
    "Bajaj 10000 10W-50 oil, changed every 10,000 km",
    "Services only at authorised Bajaj dealers",
  ],
};

export const HELPLINE = { phone: "7219821111", hours: "Mon–Sun, 9 am – 8 pm", email: "customerservice@bajajauto.co.in" };

/** Index (1–3) of a free service an entry's category refers to, e.g. "2nd Service" → 2. */
export function freeServiceNumber(category: string): number | null {
  const m = category.trim().toLowerCase().match(/^(1st|2nd|3rd|first|second|third)\b/);
  if (!m) return null;
  return { "1st": 1, first: 1, "2nd": 2, second: 2, "3rd": 3, third: 3 }[m[1]] ?? null;
}
