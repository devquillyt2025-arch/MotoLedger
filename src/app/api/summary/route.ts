import { NextResponse } from "next/server";
import { withErrors } from "@/lib/api";
import { getSummary } from "@/lib/data";

export const dynamic = "force-dynamic";

export const GET = withErrors(async () => NextResponse.json(await getSummary()));
