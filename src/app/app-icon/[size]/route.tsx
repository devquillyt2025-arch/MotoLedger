import { appIcon } from "@/lib/app-icon";

// Edge runtime: next/og's Node build mis-resolves its font path on Windows dev machines.
export const runtime = "edge";

const SIZES = new Set([192, 512]);

/** /app-icon/192, /app-icon/512 and /app-icon/512?maskable — PNG icons for the web app manifest. */
export function GET(req: Request, { params }: { params: { size: string } }) {
  const size = Number(params.size);
  if (!SIZES.has(size)) return new Response("Not found", { status: 404 });
  const maskable = new URL(req.url).searchParams.has("maskable");
  return appIcon(size, maskable ? { pad: Math.round(size * 0.1) } : {});
}
