import { asc, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { cache } from "react";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { FUEL_PRICE_PER_LITRE } from "./constants";

export const PROFILE_COOKIE = "ml_profile";
export const MAX_NAME = 40;
export const MAX_BIKE = 60;

export const listProfiles = cache(async () => db.select().from(profiles).orderBy(asc(profiles.id)));

/**
 * The profile this request acts as: the cookie's profile if it still exists, else the first one.
 * Creates a starter profile on a brand-new database so there is always one.
 */
export const getCurrentProfile = cache(async () => {
  let all = await listProfiles();
  if (!all.length) {
    await db.insert(profiles).values({ name: "Me", bike: "Bajaj Dominar 400" });
    all = await db.select().from(profiles).orderBy(asc(profiles.id));
  }
  const wanted = Number(cookies().get(PROFILE_COOKIE)?.value);
  return all.find((p) => p.id === wanted) ?? all[0];
});

/** Petrol price (₹/L) the active profile uses for litre estimates. */
export const getFuelPrice = cache(async () => {
  const p = await getCurrentProfile();
  return p.fuelPrice != null ? Number(p.fuelPrice) : FUEL_PRICE_PER_LITRE;
});

/** Shorthand for queries: the current profile's id. */
export const currentProfileId = async () => (await getCurrentProfile()).id;

export function parseProfileInput(body: unknown): { name: string; bike: string } | string {
  const b = (body ?? {}) as { name?: unknown; bike?: unknown };
  const name = typeof b.name === "string" ? b.name.trim() : "";
  const bike = typeof b.bike === "string" ? b.bike.trim() : "";
  if (!name) return "Enter a name";
  if (!bike) return "Enter the bike";
  if (name.length > MAX_NAME) return `Name must be under ${MAX_NAME} characters`;
  if (bike.length > MAX_BIKE) return `Bike must be under ${MAX_BIKE} characters`;
  return { name, bike };
}

export async function createProfile(input: { name: string; bike: string }) {
  const [row] = await db.insert(profiles).values(input).returning();
  return row;
}

export async function updateProfile(id: number, input: { name: string; bike: string }) {
  const [row] = await db.update(profiles).set(input).where(eq(profiles.id, id)).returning();
  return row ?? null;
}

/** Deletes a profile and (via ON DELETE CASCADE) all its entries, reminders and readings. */
export async function deleteProfile(id: number) {
  const [row] = await db.delete(profiles).where(eq(profiles.id, id)).returning({ id: profiles.id });
  return row ?? null;
}
