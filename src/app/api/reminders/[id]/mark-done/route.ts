import { NextResponse } from "next/server";
import { markReminderDone } from "@/lib/data";

/** Body (all optional): { date: "YYYY-MM-DD", odometer: number | null }. Defaults: today, latest known odometer. */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!Number.isInteger(id)) return NextResponse.json({ error: "Bad id" }, { status: 400 });

  const body = (await req.json().catch(() => ({}))) as { date?: unknown; odometer?: unknown };
  const date = typeof body.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.date) ? body.date : undefined;
  let odometer: number | null | undefined;
  if (body.odometer === null) odometer = null;
  else if (body.odometer !== undefined && body.odometer !== "") {
    odometer = Number(body.odometer);
    if (!Number.isInteger(odometer) || odometer < 0) {
      return NextResponse.json({ error: "odometer must be a whole number" }, { status: 400 });
    }
  }

  const row = await markReminderDone(id, date, odometer);
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(row);
}
