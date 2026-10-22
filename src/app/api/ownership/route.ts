import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { badRequest, withErrors } from "@/lib/api";
import { parseOwnership } from "@/lib/ownership";
import { currentProfileId } from "@/lib/profile";

/** Replaces the active profile's purchase / RTO / insurance details. Empty body clears them. */
export const PATCH = withErrors(async (req: Request) => {
  const ownership = parseOwnership(await req.json().catch(() => null));
  if (typeof ownership === "string") return badRequest(ownership);
  const [row] = await db
    .update(profiles)
    .set({ ownership })
    .where(eq(profiles.id, await currentProfileId()))
    .returning({ id: profiles.id, ownership: profiles.ownership });
  return NextResponse.json(row);
});
