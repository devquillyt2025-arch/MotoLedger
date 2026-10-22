import type { Metadata, Viewport } from "next";
import { AddEntryFab, AddEntryProvider } from "@/components/AddEntry";
import Sidebar from "@/components/Sidebar";
import { getEntryMeta, getReminders } from "@/lib/data";
import "./globals.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Moto Ledger",
  description: "Personal bike fuel, service and maintenance tracker",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#09090b",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [meta, { reminders }] = await Promise.all([getEntryMeta(), getReminders()]);
  const alerts = reminders.filter((r) => r.status !== "ok").length;

  return (
    <html lang="en-IN">
      <body>
        <AddEntryProvider meta={meta}>
          <div className="lg:flex">
            <Sidebar alerts={alerts} odometer={meta.currentOdometer} />
            <main className="min-w-0 flex-1 px-4 pb-28 pt-5 lg:px-10 lg:pb-10 lg:pt-8">
              <div className="mx-auto max-w-[1600px]">{children}</div>
            </main>
          </div>
          <AddEntryFab />
        </AddEntryProvider>
      </body>
    </html>
  );
}
