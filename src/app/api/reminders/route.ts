import { NextResponse } from "next/server";
import { withErrors } from "@/lib/api";
import { getReminders } from "@/lib/data";

export const dynamic = "force-dynamic";

export const GET = withErrors(async () => NextResponse.json(await getReminders()));
