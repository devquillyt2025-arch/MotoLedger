import { NextResponse, type NextRequest } from "next/server";
import { badRequest, notFound, parseId, withErrors } from "@/lib/api";
import { deleteProfile, listProfiles, parseProfileInput, PROFILE_COOKIE, updateProfile } from "@/lib/profile";

type Ctx = { params: { id: string } };

/** Body: { name, bike }. */
export const PATCH = withErrors(async (req: Request, { params }: Ctx) => {
  const id = parseId(params.id);
  if (!id) return badRequest("Bad id");
  const input = parseProfileInput(await req.json().catch(() => null));
  if (typeof input === "string") return badRequest(input);
  const row = await updateProfile(id, input);
  return row ? NextResponse.json(row) : notFound();
});

/** Deletes the profile and all its data. The last remaining profile can't be deleted. */
export const DELETE = withErrors(async (req: NextRequest, { params }: Ctx) => {
  const id = parseId(params.id);
  if (!id) return badRequest("Bad id");
  const all = await listProfiles();
  if (!all.some((p) => p.id === id)) return notFound();
  if (all.length <= 1) return badRequest("You need at least one profile");
  await deleteProfile(id);
  const res = NextResponse.json({ ok: true });
  // Only fall back to another profile if this device was using the deleted one.
  if (req.cookies.get(PROFILE_COOKIE)?.value === String(id)) res.cookies.delete(PROFILE_COOKIE);
  return res;
});
