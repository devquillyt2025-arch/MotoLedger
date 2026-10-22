"use client";

import { BarChart3, Bell, BookOpen, Fuel, Gauge, LayoutDashboard, PanelLeftClose, PanelLeftOpen, Wrench, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { num } from "@/lib/format";
import { AddEntryButton } from "./AddEntry";
import { OdometerButton } from "./Odometer";
import { ProfileButton } from "./Profiles";

export const NAV_LINKS: { href: string; label: string; short: string; icon: LucideIcon }[] = [
  { href: "/", label: "Dashboard", short: "Home", icon: LayoutDashboard },
  { href: "/analysis", label: "Analysis", short: "Analysis", icon: BarChart3 },
  { href: "/refuels", label: "Refuel Log", short: "Refuels", icon: Fuel },
  { href: "/expenses", label: "Service & Parts", short: "Service", icon: Wrench },
  { href: "/reminders", label: "Reminders", short: "Reminders", icon: Bell },
  { href: "/bike", label: "Bike Info", short: "Bike Info", icon: BookOpen },
];

export const isActive = (path: string, href: string) => (href === "/" ? path === "/" : path.startsWith(href));

const COLLAPSE_KEY = "moto-ledger:sidebar-collapsed";

/** Desktop-only side panel (phones use BottomNav). Collapsible to icons; choice remembered. */
export default function Sidebar({ alerts, odometer }: { alerts: number; odometer: number | null }) {
  const path = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1");
    } catch {}
  }, []);

  function toggle() {
    setCollapsed((c) => {
      try {
        localStorage.setItem(COLLAPSE_KEY, c ? "0" : "1");
      } catch {}
      return !c;
    });
  }

  return (
    <aside
      className={`sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-zinc-800 bg-zinc-950 transition-[width] duration-200 lg:flex ${
        collapsed ? "w-[76px]" : "w-64"
      }`}
    >
      <div className={`flex h-16 items-center px-5 ${collapsed ? "justify-center px-0" : "justify-between"}`}>
        {!collapsed && (
          <Link href="/" className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-emerald-500 text-sm font-black text-zinc-950">M</span>
            <span className="text-base font-bold tracking-tight">Moto Ledger</span>
          </Link>
        )}
        <button onClick={toggle} className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-900 hover:text-zinc-200" aria-label="Toggle sidebar">
          {collapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
        </button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-3 pt-2">
        <ProfileButton compact={collapsed} />
        {!collapsed && <AddEntryButton className="btn-primary w-full" />}
        <nav className="flex flex-col gap-1">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => {
            const active = isActive(path, href);
            const badge = href === "/reminders" && alerts > 0 ? alerts : null;
            return (
              <Link
                key={href}
                href={href}
                title={collapsed ? label : undefined}
                className={`relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium transition ${
                  active ? "bg-zinc-800/80 text-emerald-400" : "text-zinc-300 hover:bg-zinc-900 hover:text-white"
                } ${collapsed ? "justify-center" : ""}`}
              >
                <Icon className="h-5 w-5 shrink-0" strokeWidth={1.75} />
                {!collapsed && <span className="flex-1">{label}</span>}
                {badge != null && (
                  <span
                    className={`grid h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1.5 text-[11px] font-bold text-white ${
                      collapsed ? "absolute right-1.5 top-1" : ""
                    }`}
                  >
                    {badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-zinc-800 p-3">
        <OdometerButton
          className={`flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left text-sm transition hover:bg-zinc-900 ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <Gauge className="h-5 w-5 shrink-0 text-zinc-500" strokeWidth={1.75} />
          {!collapsed && (
            <span className="min-w-0 flex-1">
              <span className="label block">Odometer</span>
              <span className="block font-semibold tabular-nums">{odometer != null ? `${num(odometer)} km` : "Not logged"}</span>
            </span>
          )}
          {!collapsed && <span className="text-xs font-semibold text-emerald-400">Update</span>}
        </OdometerButton>
      </div>
    </aside>
  );
}
