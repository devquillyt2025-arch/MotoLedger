import { NextResponse } from "next/server";
import { badRequest, notFound, parseId, withErrors } from "@/lib/api";
import { markReminderDone, MAX_ODOMETER } from "@/lib/data";
import { isIsoDate } from "@/lib/format";

/** Body (all optional): { date: "YYYY-MM-DD", odometer: number | null }. Defaults: today, latest known odometer. */
export const PATCH = withErrors(async (req: Request, { params }: { params: { id: string } }) => {
  const id = parseId(params.id);
  if (!id) return badRequest("Bad id");

  const body = ((await req.json().catch(() => null)) ?? {}) as { date?: unknown; odometer?: unknown };
  if (body.date !== undefined && !isIsoDate(body.date)) return badRequest("Enter a valid date");

  let odometer: number | null | undefined;
  if (body.odometer === null || body.odometer === "") odometer = null;
  else if (body.odometer !== undefined) {
    odometer = Number(body.odometer);
    if (!Number.isInteger(odometer) || odometer < 0 || odometer > MAX_ODOMETER) {
      return badRequest("Odometer must be a whole number of km");
    }
  }

  const row = await markReminderDone(id, body.date as string | undefined, odometer);
  return row ? NextResponse.json(row) : notFound();
});
