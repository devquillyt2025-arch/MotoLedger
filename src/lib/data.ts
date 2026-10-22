import { asc, eq, getTableColumns, max, sql } from "drizzle-orm";
import { cache } from "react";
import { db } from "@/db";
import { entries, entryType, reminders, type EntryType, type Reminder } from "@/db/schema";
import { DEFAULT_REMINDERS, FUEL_PRICE_PER_LITRE, WARN_DAYS, WARN_KM } from "./constants";
import { isIsoDate, todayIST } from "./format";

// Limits that keep bad input from reaching Postgres as a 500 (numeric(10,2) / integer overflow).
const MAX_AMOUNT = 10_000_000;
const MAX_ODOMETER = 2_000_000;
const MAX_CATEGORY = 60;
const MAX_NOTES = 500;

// ---------- Entries ----------

export type EntryRow = Awaited<ReturnType<typeof listEntries>>[number];

/** All entries oldest-first, with a per-type sequence (#1, #2…) and per-type running total. */
export const listEntries = cache(async () => {
  const window = sql`partition by ${entries.type} order by ${entries.date}, ${entries.id}`;
  return db
    .select({
      ...getTableColumns(entries),
      amount: sql<number>`${entries.amount}`.mapWith(Number),
      seq: sql<number>`row_number() over (${window})`.mapWith(Number),
      runningTotal: sql<number>`sum(${entries.amount}) over (${window})`.mapWith(Number),
    })
    .from(entries)
    .orderBy(asc(entries.date), asc(entries.id));
});

export type EntryInput = {
  type: EntryType;
  date: string;
  amount: number;
  odometer: number | null;
  category: string;
  notes: string | null;
};

/** Validates a create/update body. Returns the clean input, or an error message. */
export function parseEntryInput(body: unknown): EntryInput | string {
  if (!body || typeof body !== "object") return "Invalid body";
  const b = body as Record<string, unknown>;
  if (!entryType.enumValues.includes(b.type as EntryType)) return "Type must be refuel, service or accessory";
  if (!isIsoDate(b.date)) return "Enter a valid date";
  const amount = Number(b.amount);
  if (b.amount === "" || !Number.isFinite(amount) || amount <= 0) return "Amount must be more than ₹0";
  if (amount >= MAX_AMOUNT) return "Amount is too large";
  let odometer: number | null = null;
  if (b.odometer !== undefined && b.odometer !== null && b.odometer !== "") {
    odometer = Number(b.odometer);
    if (!Number.isInteger(odometer) || odometer < 0 || odometer > MAX_ODOMETER) return "Odometer must be a whole number of km";
  }
  const category = typeof b.category === "string" ? b.category.trim() : "";
  if (!category) return "Category is required";
  if (category.length > MAX_CATEGORY) return `Category must be under ${MAX_CATEGORY} characters`;
  const notes = typeof b.notes === "string" && b.notes.trim() ? b.notes.trim() : null;
  if (notes && notes.length > MAX_NOTES) return `Notes must be under ${MAX_NOTES} characters`;
  return { type: b.type as EntryType, date: b.date, amount: Math.round(amount * 100) / 100, odometer, category, notes };
}

/** An existing entry as the edit modal needs it — plain, serialisable fields only. */
export type EditableEntry = EntryInput & { id: number; seq: number };

export const editable = (e: EntryRow): EditableEntry => ({
  id: e.id,
  seq: e.seq,
  type: e.type,
  date: e.date,
  amount: e.amount,
  odometer: e.odometer,
  category: e.category,
  notes: e.notes,
});

const asRow = <T extends { amount: string }>(r: T) => ({ ...r, amount: Number(r.amount) });

export async function createEntry(input: EntryInput) {
  const [row] = await db
    .insert(entries)
    .values({ ...input, amount: input.amount.toFixed(2) })
    .returning();
  return asRow(row);
}

export async function updateEntry(id: number, input: EntryInput) {
  const [row] = await db
    .update(entries)
    .set({ ...input, amount: input.amount.toFixed(2) })
    .where(eq(entries.id, id))
    .returning();
  return row ? asRow(row) : null;
}

export async function deleteEntry(id: number) {
  const [row] = await db.delete(entries).where(eq(entries.id, id)).returning({ id: entries.id });
  return row ?? null;
}

/** Per-type counts (for the next #) and the current odometer — what the Add Entry modal needs. */
export const getEntryMeta = cache(async () => {
  const [counts, currentOdometer] = await Promise.all([
    db
      .select({ type: entries.type, n: sql<number>`count(*)`.mapWith(Number) })
      .from(entries)
      .groupBy(entries.type),
    getCurrentOdometer(),
  ]);
  const nextSeq = { refuel: 1, service: 1, accessory: 1 } satisfies Record<EntryType, number>;
  for (const c of counts) nextSeq[c.type] = c.n + 1;
  return { nextSeq, currentOdometer };
});

export type EntryMeta = Awaited<ReturnType<typeof getEntryMeta>>;

// ---------- Summary ----------

const refuelOnly = sql`${entries.type} = 'refuel'`;

export const getSummary = cache(async () => {
  const [[agg], [latest], refuels, currentOdometer] = await Promise.all([
    db
      .select({
        fuel: sql<number>`coalesce(sum(${entries.amount}) filter (where ${refuelOnly}), 0)`.mapWith(Number),
        service: sql<number>`coalesce(sum(${entries.amount}) filter (where ${entries.type} = 'service'), 0)`.mapWith(Number),
        accessory: sql<number>`coalesce(sum(${entries.amount}) filter (where ${entries.type} = 'accessory'), 0)`.mapWith(Number),
        firstService: sql<number>`coalesce(sum(${entries.amount}) filter (where ${entries.type} = 'service' and lower(${entries.category}) = '1st service'), 0)`.mapWith(Number),
        refuels: sql<number>`count(*) filter (where ${refuelOnly})`.mapWith(Number),
        lowestRefill: sql<number>`min(${entries.amount}) filter (where ${refuelOnly})`.mapWith(Number),
        highestRefill: sql<number>`max(${entries.amount}) filter (where ${refuelOnly})`.mapWith(Number),
        totalEntries: sql<number>`count(*)`.mapWith(Number),
      })
      .from(entries),
    db
      .select({ amount: sql<number>`${entries.amount}`.mapWith(Number), date: entries.date })
      .from(entries)
      .where(refuelOnly)
      .orderBy(sql`${entries.date} desc, ${entries.id} desc`)
      .limit(1),
    db
      .select({ odometer: entries.odometer, amount: sql<number>`${entries.amount}`.mapWith(Number) })
      .from(entries)
      .where(refuelOnly)
      .orderBy(asc(entries.date), asc(entries.id)),
    getCurrentOdometer(),
  ]);

  return {
    totalFuelSpend: agg.fuel,
    totalBikeSpend: agg.fuel + agg.service,
    accessorySpend: agg.accessory,
    totalRefuels: agg.refuels,
    firstServiceCost: agg.firstService,
    lowestRefill: agg.refuels ? agg.lowestRefill : null,
    highestRefill: agg.refuels ? agg.highestRefill : null,
    latestRefill: latest ?? null,
    estFuelLitres: agg.fuel / FUEL_PRICE_PER_LITRE,
    totalEntries: agg.totalEntries,
    mileageKmpl: mileage(refuels),
    currentOdometer,
  };
});

export type Summary = Awaited<ReturnType<typeof getSummary>>;

/**
 * Average km/L: distance between the first and last refuel that logged an odometer reading, divided by
 * ALL fuel bought from that first reading up to (not including) the last one — refills without a reading
 * in between still count, and the last fill hasn't been ridden yet.
 */
function mileage(refuels: { odometer: number | null; amount: number }[]) {
  const first = refuels.findIndex((r) => r.odometer != null);
  const last = refuels.findLastIndex((r) => r.odometer != null);
  if (first < 0 || last <= first) return null;
  const distance = refuels[last].odometer! - refuels[first].odometer!;
  const litres = refuels.slice(first, last).reduce((s, r) => s + r.amount, 0) / FUEL_PRICE_PER_LITRE;
  return distance > 0 && litres > 0 ? distance / litres : null;
}

/** Best known odometer: the highest reading on any entry or reminder. */
export const getCurrentOdometer = cache(async (): Promise<number | null> => {
  const [[e], [r]] = await Promise.all([
    db.select({ v: max(entries.odometer) }).from(entries),
    db.select({ v: max(reminders.lastDoneOdometer) }).from(reminders),
  ]);
  const vals = [e?.v, r?.v].filter((v): v is number => v != null);
  return vals.length ? Math.max(...vals) : null;
});

// ---------- Reminders ----------

export type ReminderStatus = "overdue" | "upcoming" | "ok";

export type ReminderView = Reminder & {
  nextDueDate: string | null;
  nextDueOdometer: number | null;
  daysLeft: number | null;
  kmLeft: number | null;
  status: ReminderStatus;
};

const DAY_MS = 86_400_000;
const toUTC = (iso: string) => Date.parse(`${iso}T00:00:00Z`);

export function computeReminder(r: Reminder, currentOdo: number | null, today = todayIST()): ReminderView {
  const nextDueDate =
    r.intervalDays != null
      ? new Date(toUTC(r.lastDoneDate) + r.intervalDays * DAY_MS).toISOString().slice(0, 10)
      : null;
  const daysLeft = nextDueDate ? Math.round((toUTC(nextDueDate) - toUTC(today)) / DAY_MS) : null;

  const nextDueOdometer =
    r.intervalKm != null && r.lastDoneOdometer != null ? r.lastDoneOdometer + r.intervalKm : null;
  const kmLeft = nextDueOdometer != null && currentOdo != null ? nextDueOdometer - currentOdo : null;

  let status: ReminderStatus = "ok";
  if ((daysLeft != null && daysLeft < 0) || (kmLeft != null && kmLeft < 0)) status = "overdue";
  else if ((daysLeft != null && daysLeft <= WARN_DAYS) || (kmLeft != null && kmLeft <= WARN_KM)) status = "upcoming";

  return { ...r, nextDueDate, nextDueOdometer, daysLeft, kmLeft, status };
}

/** All reminders with due status. Seeds the defaults on first use (safe under concurrent requests). */
export const getReminders = cache(async () => {
  let [rows, currentOdometer] = await Promise.all([
    db.select().from(reminders).orderBy(asc(reminders.id)),
    getCurrentOdometer(),
  ]);

  if (rows.length < DEFAULT_REMINDERS.length) {
    await db
      .insert(reminders)
      .values(
        DEFAULT_REMINDERS.map((d) => ({
          ...d,
          lastDoneDate: todayIST(),
          lastDoneOdometer: currentOdometer,
        })),
      )
      .onConflictDoNothing({ target: reminders.type });
    rows = await db.select().from(reminders).orderBy(asc(reminders.id));
  }

  return { currentOdometer, reminders: rows.map((r) => computeReminder(r, currentOdometer)) };
});

export async function markReminderDone(id: number, date?: string, odometer?: number | null) {
  const odo = odometer !== undefined ? odometer : await getCurrentOdometer();
  const [row] = await db
    .update(reminders)
    .set({ lastDoneDate: date ?? todayIST(), lastDoneOdometer: odo })
    .where(eq(reminders.id, id))
    .returning();
  return row ?? null;
}

export async function updateReminderIntervals(
  id: number,
  patch: { intervalKm?: number | null; intervalDays?: number | null },
) {
  const [row] = await db.update(reminders).set(patch).where(eq(reminders.id, id)).returning();
  return row ?? null;
}

export { MAX_ODOMETER };
