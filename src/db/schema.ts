import { date, index, integer, jsonb, numeric, pgEnum, pgTable, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const entryType = pgEnum("entry_type", ["refuel", "service", "accessory"]);
export const reminderType = pgEnum("reminder_type", ["chain_lube", "service", "accessory_charge", "oil_change", "tyre_pressure", "coolant_change"]);

/** A rider + their bike. Everything else belongs to exactly one profile. No login — switched by cookie. */
export const profiles = pgTable("profiles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  bike: text("bike").notNull(),
  /** Rider-entered bike details for Bike Info (null = none yet; Dominar profiles use the built-in manual). */
  specs: jsonb("specs").$type<BikeSpecs>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type BikeSpecs = Partial<Record<string, string>> & { tankLitres?: string };

const profileId = () =>
  integer("profile_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" });

export const entries = pgTable(
  "entries",
  {
    id: serial("id").primaryKey(),
    profileId: profileId(),
    type: entryType("type").notNull(),
    date: date("date", { mode: "string" }).notNull(),
    amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
    odometer: integer("odometer"),
    notes: text("notes"),
    category: text("category").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("entries_profile_idx").on(t.profileId, t.date)],
);

export const reminders = pgTable(
  "reminders",
  {
    id: serial("id").primaryKey(),
    profileId: profileId(),
    type: reminderType("type").notNull(),
    label: text("label").notNull(),
    intervalKm: integer("interval_km"),
    intervalDays: integer("interval_days"),
    lastDoneDate: date("last_done_date", { mode: "string" }).notNull(),
    lastDoneOdometer: integer("last_done_odometer"),
  },
  (t) => [uniqueIndex("reminders_profile_type_idx").on(t.profileId, t.type)],
);

/** Standalone odometer readings (no expense attached) — "Update odometer". */
export const odometerLogs = pgTable(
  "odometer_logs",
  {
    id: serial("id").primaryKey(),
    profileId: profileId(),
    date: date("date", { mode: "string" }).notNull(),
    km: integer("km").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("odometer_logs_profile_idx").on(t.profileId, t.date)],
);

export type Profile = typeof profiles.$inferSelect;
export type Entry = typeof entries.$inferSelect;
export type EntryType = (typeof entryType.enumValues)[number];
export type Reminder = typeof reminders.$inferSelect;
