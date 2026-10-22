import { NextResponse } from "next/server";
import { badRequest, notFound, parseId, withErrors } from "@/lib/api";
import { deleteOdometerLog } from "@/lib/data";

export const DELETE = withErrors(async (_req: Request, { params }: { params: { id: string } }) => {
  const id = parseId(params.id);
  if (!id) return badRequest("Bad id");
  return (await deleteOdometerLog(id)) ? NextResponse.json({ ok: true }) : notFound();
});
