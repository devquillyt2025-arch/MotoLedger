import { ImageResponse } from "next/og";

/**
 * The Moto Ledger mark: a heavy "M" (drawn as a path — next/og only ships a regular-weight font)
 * on an emerald tile. `pad` insets the mark for maskable icons; `rounded` off for iOS, which rounds itself.
 */
export function appIcon(size: number, { pad = 0, rounded = true }: { pad?: number; rounded?: boolean } = {}) {
  const inner = size - pad * 2;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#10b981",
          borderRadius: rounded && !pad ? size * 0.22 : 0,
        }}
      >
        <svg width={inner * 0.62} height={inner * 0.62} viewBox="0 0 100 100">
          <path d="M14 86V14h20l16 28 16-28h20v72H67V45L50 74 33 45v41z" fill="#09090b" />
        </svg>
      </div>
    ),
    { width: size, height: size },
  );
}
