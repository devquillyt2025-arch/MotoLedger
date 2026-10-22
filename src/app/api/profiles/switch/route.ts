import { NextResponse } from "next/server";
import { badRequest, notFound, withErrors } from "@/lib/api";
import { listProfiles, PROFILE_COOKIE } from "@/lib/profile";

/** Body: { id }. Remembers the chosen profile on this device. */
export const POST = withErrors(async (req: Request) => {
  const body = ((await req.json().catch(() => null)) ?? {}) as { id?: unknown };
  const id = Number(body.id);
  if (!Number.isInteger(id)) return badRequest("Bad id");
  if (!(await listProfiles()).some((p) => p.id === id)) return notFound();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(PROFILE_COOKIE, String(id), { path: "/", maxAge: 60 * 60 * 24 * 400, sameSite: "lax" });
  return res;
});
