import type { Metadata, Viewport } from "next";
import { AddEntryProvider } from "@/components/AddEntry";
import BottomNav from "@/components/BottomNav";
import { OdometerProvider } from "@/components/Odometer";
import Sidebar from "@/components/Sidebar";
import { getEntryMeta, getReminders, listOdometerLogs } from "@/lib/data";
import "./globals.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Moto Ledger",
  description: "Personal bike fuel, service and maintenance tracker",
  applicationName: "Moto Ledger",
  // Installed to the home screen it opens full-screen like a native app.
  appleWebApp: { capable: true, title: "Moto Ledger", statusBarStyle: "black-translucent" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover", // draw under the notch; safe-area insets pad the bars
  themeColor: "#09090b",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [meta, { reminders }, odometerLogs] = await Promise.all([getEntryMeta(), getReminders(), listOdometerLogs()]);
  const alerts = reminders.filter((r) => r.status !== "ok").length;

  return (
    <html lang="en-IN">
      <body>
        <AddEntryProvider meta={meta}>
          <OdometerProvider current={meta.currentOdometer} logs={odometerLogs}>
          <div className="lg:flex">
            <Sidebar alerts={alerts} odometer={meta.currentOdometer} />
            {/* Phones: leave room for the bottom tab bar + home indicator. */}
            <main className="min-w-0 flex-1 px-4 pb-[calc(env(safe-area-inset-bottom)+6rem)] lg:px-10 lg:pb-10">
              <div className="mx-auto max-w-[1600px]">{children}</div>
            </main>
          </div>
          <BottomNav alerts={alerts} odometer={meta.currentOdometer} />
          </OdometerProvider>
        </AddEntryProvider>
      </body>
    </html>
  );
}
