import { appIcon } from "@/lib/app-icon";

// Edge runtime: next/og's Node build mis-resolves its font path on Windows dev machines.
export const runtime = "edge";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return appIcon(64);
}
