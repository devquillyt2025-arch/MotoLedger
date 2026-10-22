import { NextResponse } from "next/server";
import { createEntry, listEntries, parseEntryInput } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await listEntries());
}

export async function POST(req: Request) {
  const input = parseEntryInput(await req.json().catch(() => null));
  if (typeof input === "string") return NextResponse.json({ error: input }, { status: 400 });
  return NextResponse.json(await createEntry(input), { status: 201 });
}
