import { appIcon } from "@/lib/app-icon";

// Edge runtime: next/og's Node build mis-resolves its font path on Windows dev machines.
export const runtime = "edge";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** iOS rounds the corners itself, so the tile stays square. */
export default function AppleIcon() {
  return appIcon(180, { rounded: false });
}
