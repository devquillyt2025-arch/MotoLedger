"use client";

import { Bell, Fuel, Gauge, LayoutDashboard, MoreHorizontal, Plus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { num } from "@/lib/format";
import { useEntryModal } from "./AddEntry";
import { Modal } from "./Modal";
import { useOdometer } from "./Odometer";
import { isActive, NAV_LINKS } from "./Sidebar";

const TABS = [
  { href: "/", label: "Home", icon: LayoutDashboard },
  { href: "/refuels", label: "Refuels", icon: Fuel },
  { href: "/reminders", label: "Reminders", icon: Bell },
];
const MORE = NAV_LINKS.filter((l) => !TABS.some((t) => t.href === l.href));

/** Phone navigation: app-style tab bar with a raised Add button and a "More" sheet. */
export default function BottomNav({ alerts, odometer }: { alerts: number; odometer: number | null }) {
  const path = usePathname();
  const { add } = useEntryModal();
  const openOdometer = useOdometer();
  const [more, setMore] = useState(false);
  const moreActive = MORE.some((l) => isActive(path, l.href));

  useEffect(() => setMore(false), [path]);

  const tab = (href: string, label: string, Icon: typeof Fuel, badge?: number) => {
    const active = isActive(path, href);
    return (
      <Link
        key={href}
        href={href}
        className={`relative flex flex-1 flex-col items-center justify-center gap-0.5 pt-2 text-[11px] font-medium ${
          active ? "text-emerald-400" : "text-zinc-500"
        }`}
      >
        <Icon className="h-6 w-6" strokeWidth={active ? 2.2 : 1.75} />
        {label}
        {!!badge && (
          <span className="absolute left-1/2 top-1 ml-2 grid h-4 min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {badge}
          </span>
        )}
      </Link>
    );
  };

  return (
    <>
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-800 bg-zinc-950/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
        aria-label="Main"
      >
        <div className="mx-auto flex h-16 max-w-lg items-stretch">
          {tab(TABS[0].href, TABS[0].label, TABS[0].icon)}
          {tab(TABS[1].href, TABS[1].label, TABS[1].icon)}
          <div className="flex flex-1 items-start justify-center">
            <button
              onClick={() => add()}
              aria-label="Add entry"
              className="-mt-5 grid h-14 w-14 place-items-center rounded-full bg-emerald-500 text-zinc-950 shadow-lg shadow-emerald-500/30 ring-4 ring-zinc-950 transition active:scale-95"
            >
              <Plus className="h-7 w-7" strokeWidth={2.5} />
            </button>
          </div>
          {tab(TABS[2].href, TABS[2].label, TABS[2].icon, alerts)}
          <button
            onClick={() => setMore(true)}
            className={`flex flex-1 flex-col items-center justify-center gap-0.5 pt-2 text-[11px] font-medium ${
              moreActive ? "text-emerald-400" : "text-zinc-500"
            }`}
          >
            <MoreHorizontal className="h-6 w-6" strokeWidth={moreActive ? 2.2 : 1.75} />
            More
          </button>
        </div>
      </nav>

      {more && (
        <Modal title="More" onClose={() => setMore(false)}>
          <div className="grid grid-cols-3 gap-2">
            {MORE.map(({ href, short, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center gap-2 rounded-2xl border px-2 py-4 text-sm font-medium ${
                  isActive(path, href) ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300" : "border-zinc-800 text-zinc-300"
                }`}
              >
                <Icon className="h-6 w-6" strokeWidth={1.75} />
                {short}
              </Link>
            ))}
          </div>
          <button
            type="button"
            onClick={() => {
              setMore(false);
              openOdometer();
            }}
            className="mt-4 flex w-full items-center gap-3 rounded-2xl border border-zinc-800 px-4 py-3 text-left text-sm active:bg-zinc-800/60"
          >
            <Gauge className="h-5 w-5 text-zinc-500" strokeWidth={1.75} />
            <span className="text-zinc-400">Odometer</span>
            <span className="ml-auto font-semibold tabular-nums">{odometer != null ? `${num(odometer)} km` : "Not logged"}</span>
            <span className="text-xs font-semibold text-emerald-400">Update</span>
          </button>
        </Modal>
      )}
    </>
  );
}
