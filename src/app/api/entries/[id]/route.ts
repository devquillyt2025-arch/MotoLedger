import { NextResponse } from "next/server";
import { badRequest, notFound, parseId, withErrors } from "@/lib/api";
import { deleteEntry, parseEntryInput, updateEntry } from "@/lib/data";

type Ctx = { params: { id: string } };

/** Replace an entry. Body is the same shape as POST /api/entries. */
export const PATCH = withErrors(async (req: Request, { params }: Ctx) => {
  const id = parseId(params.id);
  if (!id) return badRequest("Bad id");
  const input = parseEntryInput(await req.json().catch(() => null));
  if (typeof input === "string") return badRequest(input);
  const row = await updateEntry(id, input);
  return row ? NextResponse.json(row) : notFound();
});

export const DELETE = withErrors(async (_req: Request, { params }: Ctx) => {
  const id = parseId(params.id);
  if (!id) return badRequest("Bad id");
  return (await deleteEntry(id)) ? NextResponse.json({ ok: true }) : notFound();
});
