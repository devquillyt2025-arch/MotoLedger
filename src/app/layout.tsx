import type { Metadata, Viewport } from "next";
import Nav from "@/components/Nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "Moto Ledger",
  description: "Personal bike fuel, service and maintenance tracker",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#09090b",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN">
      <body>
        <Nav />
        <main className="mx-auto max-w-3xl px-4 pb-28 pt-4">{children}</main>
      </body>
    </html>
  );
}
