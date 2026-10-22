import { asc, eq, getTableColumns, max, sql } from "drizzle-orm";
import { db } from "@/db";
import { entries, entryType, reminders, type EntryType, type Reminder } from "@/db/schema";
import { DEFAULT_REMINDERS, FUEL_PRICE_PER_LITRE, WARN_DAYS, WARN_KM } from "./constants";
import { todayIST } from "./format";

// ---------- Entries ----------

export type EntryRow = Awaited<ReturnType<typeof listEntries>>[number];

/** All entries oldest-first, with a per-type sequence (#1, #2…) and per-type running total. */
export async function listEntries() {
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
}

export type NewEntryInput = {
  type: EntryType;
  date: string;
  amount: number;
  odometer: number | null;
  category: string;
  notes: string | null;
};

export function parseEntryInput(body: unknown): NewEntryInput | string {
  if (!body || typeof body !== "object") return "Invalid body";
  const b = body as Record<string, unknown>;
  if (!entryType.enumValues.includes(b.type as EntryType)) return "type must be refuel, service or accessory";
  if (typeof b.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(b.date)) return "date must be YYYY-MM-DD";
  const amount = Number(b.amount);
  if (!Number.isFinite(amount) || amount <= 0) return "amount must be a positive number";
  let odometer: number | null = null;
  if (b.odometer !== undefined && b.odometer !== null && b.odometer !== "") {
    odometer = Number(b.odometer);
    if (!Number.isInteger(odometer) || odometer < 0) return "odometer must be a whole number";
  }
  const category = typeof b.category === "string" ? b.category.trim() : "";
  if (!category) return "category is required";
  const notes = typeof b.notes === "string" && b.notes.trim() ? b.notes.trim() : null;
  return { type: b.type as EntryType, date: b.date, amount, odometer, category, notes };
}

export async function createEntry(input: NewEntryInput) {
  const [row] = await db
    .insert(entries)
    .values({ ...input, amount: input.amount.toFixed(2) })
    .returning();
  return row;
}

/** Per-type counts (for the next #) and the current odometer — what the Add Entry modal needs. */
export async function getEntryMeta() {
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
}

export type EntryMeta = Awaited<ReturnType<typeof getEntryMeta>>;

// ---------- Summary ----------

const refuelOnly = sql`${entries.type} = 'refuel'`;

export async function getSummary() {
  const [[agg], [latest], mileageKmpl, currentOdometer] = await Promise.all([
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
    getMileage(),
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
    mileageKmpl,
    currentOdometer,
  };
}

export type Summary = Awaited<ReturnType<typeof getSummary>>;

/**
 * Average km/L from refuels that logged an odometer reading: distance between the first and
 * last reading, divided by the fuel bought before the last reading (the last fill is not ridden yet).
 */
async function getMileage() {
  const rows = await db
    .select({ odometer: entries.odometer, amount: sql<number>`${entries.amount}`.mapWith(Number) })
    .from(entries)
    .where(sql`${refuelOnly} and ${entries.odometer} is not null`)
    .orderBy(asc(entries.date), asc(entries.id));
  if (rows.length < 2) return null;
  const distance = rows[rows.length - 1].odometer! - rows[0].odometer!;
  const litres = rows.slice(0, -1).reduce((s, r) => s + r.amount, 0) / FUEL_PRICE_PER_LITRE;
  return distance > 0 && litres > 0 ? distance / litres : null;
}

/** Best known odometer: the highest reading on any entry or reminder. */
export async function getCurrentOdometer(): Promise<number | null> {
  const [[e], [r]] = await Promise.all([
    db.select({ v: max(entries.odometer) }).from(entries),
    db.select({ v: max(reminders.lastDoneOdometer) }).from(reminders),
  ]);
  const vals = [e?.v, r?.v].filter((v): v is number => v != null);
  return vals.length ? Math.max(...vals) : null;
}

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

/** All reminders with due status. Seeds the three defaults on first use. */
export async function getReminders() {
  let rows = await db.select().from(reminders).orderBy(asc(reminders.id));
  const currentOdometer = await getCurrentOdometer();

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
}

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
