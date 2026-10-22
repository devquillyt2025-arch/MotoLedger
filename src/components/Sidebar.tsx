"use client";

import { Bell, BookOpen, Fuel, Gauge, LayoutDashboard, Menu, PanelLeftClose, PanelLeftOpen, Wrench, X, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { num } from "@/lib/format";
import { AddEntryButton } from "./AddEntry";

const LINKS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/refuels", label: "Refuel Log", icon: Fuel },
  { href: "/expenses", label: "Service & Parts", icon: Wrench },
  { href: "/reminders", label: "Reminders", icon: Bell },
  { href: "/bike", label: "Bike Info", icon: BookOpen },
];

const COLLAPSE_KEY = "moto-ledger:sidebar-collapsed";

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-emerald-500 text-sm font-black text-zinc-950">M</span>
      {!compact && <span className="text-base font-bold tracking-tight">Moto Ledger</span>}
    </Link>
  );
}

function NavLinks({ collapsed, alerts }: { collapsed: boolean; alerts: number }) {
  const path = usePathname();
  return (
    <nav className="flex flex-col gap-1">
      {LINKS.map(({ href, label, icon: Icon }) => {
        const active = href === "/" ? path === "/" : path.startsWith(href);
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
  );
}

function OdometerFooter({ odometer, collapsed }: { odometer: number | null; collapsed: boolean }) {
  return (
    <div className={`flex items-center gap-3 border-t border-zinc-800 px-5 py-4 text-sm ${collapsed ? "justify-center px-0" : ""}`}>
      <Gauge className="h-5 w-5 shrink-0 text-zinc-500" strokeWidth={1.75} />
      {!collapsed && (
        <div>
          <p className="label">Odometer</p>
          <p className="font-semibold tabular-nums">{odometer != null ? `${num(odometer)} km` : "not logged"}</p>
        </div>
      )}
    </div>
  );
}

/** Desktop: sticky, collapsible side panel. Phone: top bar + slide-in drawer. */
export default function Sidebar({ alerts, odometer }: { alerts: number; odometer: number | null }) {
  const path = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [drawer, setDrawer] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1");
    } catch {}
  }, []);

  useEffect(() => setDrawer(false), [path]);

  function toggle() {
    setCollapsed((c) => {
      try {
        localStorage.setItem(COLLAPSE_KEY, c ? "0" : "1");
      } catch {}
      return !c;
    });
  }

  return (
    <>
      {/* Desktop */}
      <aside
        className={`sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-zinc-800 bg-zinc-950 transition-[width] duration-200 lg:flex ${
          collapsed ? "w-[76px]" : "w-64"
        }`}
      >
        <div className={`flex h-16 items-center px-5 ${collapsed ? "justify-center px-0" : "justify-between"}`}>
          {!collapsed && <Logo />}
          <button onClick={toggle} className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-900 hover:text-zinc-200" aria-label="Toggle sidebar">
            {collapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
          </button>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto px-3 pt-2">
          {!collapsed && <AddEntryButton className="btn-primary w-full" />}
          <NavLinks collapsed={collapsed} alerts={alerts} />
        </div>
        <OdometerFooter odometer={odometer} collapsed={collapsed} />
      </aside>

      {/* Phone top bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-zinc-800 bg-zinc-950/90 px-4 backdrop-blur lg:hidden">
        <Logo />
        <button onClick={() => setDrawer(true)} className="relative rounded-lg p-2 text-zinc-300 hover:bg-zinc-900" aria-label="Open menu">
          <Menu className="h-5 w-5" />
          {alerts > 0 && <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />}
        </button>
      </header>

      {/* Phone drawer */}
      {drawer && (
        <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setDrawer(false)}>
          <div className="absolute inset-0 bg-black/70" />
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col border-r border-zinc-800 bg-zinc-950" onClick={(e) => e.stopPropagation()}>
            <div className="flex h-14 items-center justify-between px-4">
              <Logo />
              <button onClick={() => setDrawer(false)} className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-900" aria-label="Close menu">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 pt-2">
              <NavLinks collapsed={false} alerts={alerts} />
            </div>
            <OdometerFooter odometer={odometer} collapsed={false} />
          </aside>
        </div>
      )}
    </>
  );
}
