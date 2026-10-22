import { date, integer, numeric, pgEnum, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const entryType = pgEnum("entry_type", ["refuel", "service", "accessory"]);
export const reminderType = pgEnum("reminder_type", ["chain_lube", "service", "accessory_charge", "oil_change", "tyre_pressure", "coolant_change"]);

export const entries = pgTable("entries", {
  id: serial("id").primaryKey(),
  type: entryType("type").notNull(),
  date: date("date", { mode: "string" }).notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  odometer: integer("odometer"),
  notes: text("notes"),
  category: text("category").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const reminders = pgTable("reminders", {
  id: serial("id").primaryKey(),
  type: reminderType("type").notNull().unique(),
  label: text("label").notNull(),
  intervalKm: integer("interval_km"),
  intervalDays: integer("interval_days"),
  lastDoneDate: date("last_done_date", { mode: "string" }).notNull(),
  lastDoneOdometer: integer("last_done_odometer"),
});

export type Entry = typeof entries.$inferSelect;
export type EntryType = (typeof entryType.enumValues)[number];
export type Reminder = typeof reminders.$inferSelect;
