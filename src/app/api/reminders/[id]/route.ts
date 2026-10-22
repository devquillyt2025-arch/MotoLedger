import { NextResponse } from "next/server";
import { badRequest, notFound, parseId, withErrors } from "@/lib/api";
import { updateReminderIntervals } from "@/lib/data";

function parseInterval(v: unknown): number | null | undefined | "bad" {
  if (v === undefined) return undefined;
  if (v === null || v === "") return null;
  const n = Number(v);
  return Number.isInteger(n) && n > 0 && n <= 100_000 ? n : "bad";
}

/** Body: { intervalKm?: number | null, intervalDays?: number | null }. null clears that interval. */
export const PATCH = withErrors(async (req: Request, { params }: { params: { id: string } }) => {
  const id = parseId(params.id);
  if (!id) return badRequest("Bad id");

  const body = ((await req.json().catch(() => null)) ?? {}) as { intervalKm?: unknown; intervalDays?: unknown };
  const intervalKm = parseInterval(body.intervalKm);
  const intervalDays = parseInterval(body.intervalDays);
  if (intervalKm === "bad" || intervalDays === "bad") return badRequest("Intervals must be positive whole numbers");
  if (intervalKm === null && intervalDays === null) return badRequest("Set at least a km or a days interval");

  const patch: { intervalKm?: number | null; intervalDays?: number | null } = {};
  if (intervalKm !== undefined) patch.intervalKm = intervalKm;
  if (intervalDays !== undefined) patch.intervalDays = intervalDays;
  if (!Object.keys(patch).length) return badRequest("Nothing to update");

  const row = await updateReminderIntervals(id, patch);
  return row ? NextResponse.json(row) : notFound();
});
