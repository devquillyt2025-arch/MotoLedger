import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { badRequest, withErrors } from "@/lib/api";
import { currentProfileId } from "@/lib/profile";

/** Body: { price } — the active profile's petrol price in ₹/L. */
export const PATCH = withErrors(async (req: Request) => {
  const body = ((await req.json().catch(() => null)) ?? {}) as { price?: unknown };
  const price = Number(body.price);
  if (body.price === "" || !Number.isFinite(price) || price < 50 || price > 300) {
    return badRequest("Enter a petrol price between ₹50 and ₹300 per litre");
  }
  const [row] = await db
    .update(profiles)
    .set({ fuelPrice: price.toFixed(2) })
    .where(eq(profiles.id, await currentProfileId()))
    .returning({ id: profiles.id, fuelPrice: profiles.fuelPrice });
  return NextResponse.json(row);
});
