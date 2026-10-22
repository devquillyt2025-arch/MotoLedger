import { NextResponse } from "next/server";
import { badRequest, withErrors } from "@/lib/api";
import { createEntry, listEntries, parseEntryInput } from "@/lib/data";

export const dynamic = "force-dynamic";

export const GET = withErrors(async () => NextResponse.json(await listEntries()));

export const POST = withErrors(async (req: Request) => {
  const input = parseEntryInput(await req.json().catch(() => null));
  if (typeof input === "string") return badRequest(input);
  return NextResponse.json(await createEntry(input), { status: 201 });
});
