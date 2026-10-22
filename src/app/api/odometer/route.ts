import { NextResponse } from "next/server";
import { badRequest, withErrors } from "@/lib/api";
import { addOdometerLog, listOdometerLogs, MAX_ODOMETER } from "@/lib/data";
import { isIsoDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export const GET = withErrors(async () => NextResponse.json(await listOdometerLogs(50)));

/** Body: { date: "YYYY-MM-DD", km: number } */
export const POST = withErrors(async (req: Request) => {
  const body = ((await req.json().catch(() => null)) ?? {}) as { date?: unknown; km?: unknown };
  if (!isIsoDate(body.date)) return badRequest("Enter a valid date");
  const km = Number(body.km);
  if (body.km === "" || !Number.isInteger(km) || km < 0 || km > MAX_ODOMETER) {
    return badRequest("Odometer must be a whole number of km");
  }
  return NextResponse.json(await addOdometerLog(body.date, km), { status: 201 });
});
