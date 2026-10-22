import { NextResponse } from "next/server";
import { badRequest, withErrors } from "@/lib/api";
import { createProfile, getCurrentProfile, listProfiles, parseProfileInput, PROFILE_COOKIE } from "@/lib/profile";

export const dynamic = "force-dynamic";

export const GET = withErrors(async () =>
  NextResponse.json({ current: (await getCurrentProfile()).id, profiles: await listProfiles() }),
);

/** Body: { name, bike }. Creates the profile and switches to it. */
export const POST = withErrors(async (req: Request) => {
  const input = parseProfileInput(await req.json().catch(() => null));
  if (typeof input === "string") return badRequest(input);
  const row = await createProfile(input);
  const res = NextResponse.json(row, { status: 201 });
  res.cookies.set(PROFILE_COOKIE, String(row.id), { path: "/", maxAge: 60 * 60 * 24 * 400, sameSite: "lax" });
  return res;
});
