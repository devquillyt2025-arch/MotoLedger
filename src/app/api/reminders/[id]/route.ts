import { NextResponse } from "next/server";
import { updateReminderIntervals } from "@/lib/data";

function parseInterval(v: unknown): number | null | undefined | "bad" {
  if (v === undefined) return undefined;
  if (v === null || v === "") return null;
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : "bad";
}

/** Body: { intervalKm?: number | null, intervalDays?: number | null }. null clears that interval. */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!Number.isInteger(id)) return NextResponse.json({ error: "Bad id" }, { status: 400 });

  const body = (await req.json().catch(() => ({}))) as { intervalKm?: unknown; intervalDays?: unknown };
  const intervalKm = parseInterval(body.intervalKm);
  const intervalDays = parseInterval(body.intervalDays);
  if (intervalKm === "bad" || intervalDays === "bad") {
    return NextResponse.json({ error: "Intervals must be positive whole numbers" }, { status: 400 });
  }

  const patch: { intervalKm?: number | null; intervalDays?: number | null } = {};
  if (intervalKm !== undefined) patch.intervalKm = intervalKm;
  if (intervalDays !== undefined) patch.intervalDays = intervalDays;
  if (!Object.keys(patch).length) return NextResponse.json({ error: "Nothing to update" }, { status: 400 });

  const row = await updateReminderIntervals(id, patch);
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(row);
}
