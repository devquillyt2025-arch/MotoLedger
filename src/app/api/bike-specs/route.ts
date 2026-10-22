import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { badRequest, withErrors } from "@/lib/api";
import { parseSpecs } from "@/lib/bike-specs";
import { currentProfileId } from "@/lib/profile";

/** Replaces the active profile's Bike Info details. Body: { [field]: string }; empty clears. */
export const PATCH = withErrors(async (req: Request) => {
  const specs = parseSpecs(await req.json().catch(() => null));
  if (typeof specs === "string") return badRequest(specs);
  const [row] = await db
    .update(profiles)
    .set({ specs })
    .where(eq(profiles.id, await currentProfileId()))
    .returning({ id: profiles.id, specs: profiles.specs });
  return NextResponse.json(row);
});
