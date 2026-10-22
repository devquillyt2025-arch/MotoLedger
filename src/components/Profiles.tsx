"use client";

import { Check, ChevronDown, Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { createContext, useContext, useState } from "react";
import type { Profile } from "@/db/schema";
import { sendJson } from "@/lib/client";
import { ConfirmDialog, Modal } from "./Modal";

type P = Pick<Profile, "id" | "name" | "bike"> & { specs?: Profile["specs"]; fuelPrice?: number | null };
type Ctx = { current: P; profiles: P[]; open: () => void };
const ProfileContext = createContext<Ctx | null>(null);

export const useProfiles = () => useContext(ProfileContext)!;

const AVATAR_COLORS = ["bg-emerald-500", "bg-sky-500", "bg-amber-500", "bg-rose-500", "bg-violet-500", "bg-teal-500"];

export function Avatar({ profile, size = "h-9 w-9 text-sm" }: { profile: P; size?: string }) {
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-full font-bold text-zinc-950 ${size} ${
        AVATAR_COLORS[(profile.id - 1) % AVATAR_COLORS.length]
      }`}
      aria-hidden
    >
      {profile.name.trim().charAt(0).toUpperCase() || "?"}
    </span>
  );
}

/** Desktop sidebar: current rider + bike, opens the switcher. */
export function ProfileButton({ compact = false }: { compact?: boolean }) {
  const { current, open } = useProfiles();
  return (
    <button
      type="button"
      onClick={open}
      title={compact ? `${current.name} · ${current.bike}` : undefined}
      className={`flex w-full items-center gap-2.5 rounded-xl border border-zinc-800 p-2 text-left transition hover:bg-zinc-900 ${
        compact ? "justify-center border-transparent" : ""
      }`}
    >
      <Avatar profile={current} />
      {!compact && (
        <>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold">{current.name}</span>
            <span className="block truncate text-xs text-zinc-500">{current.bike}</span>
          </span>
          <ChevronDown className="h-4 w-4 text-zinc-500" />
        </>
      )}
    </button>
  );
}

/** Phone top bar: just the avatar. */
export function ProfileAvatarButton() {
  const { current, open } = useProfiles();
  return (
    <button type="button" onClick={open} aria-label={`Profile: ${current.name}. Switch profile`} className="lg:hidden">
      <Avatar profile={current} />
    </button>
  );
}

type Form = { mode: "add" } | { mode: "edit"; profile: P };

export function ProfileProvider({ current, profiles, children }: { current: P; profiles: P[]; children: React.ReactNode }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Form | null>(null);
  const [deleting, setDeleting] = useState<P | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function show() {
    setForm(null);
    setError(null);
    setOpen(true);
  }

  async function run(fn: () => Promise<string | null>, after?: () => void) {
    setBusy(true);
    setError(null);
    const err = await fn();
    setBusy(false);
    if (err) return setError(err);
    after?.();
    router.refresh();
  }

  const switchTo = (p: P) =>
    p.id === current.id ? setOpen(false) : run(() => sendJson("/api/profiles/switch", "POST", { id: p.id }), () => setOpen(false));

  function onSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const body = { name: f.get("name"), bike: f.get("bike") };
    if (form?.mode === "edit") {
      run(() => sendJson(`/api/profiles/${form.profile.id}`, "PATCH", body), () => setForm(null));
    } else {
      // Creating also switches to the new profile (server sets the cookie).
      run(() => sendJson("/api/profiles", "POST", body), () => {
        setForm(null);
        setOpen(false);
      });
    }
  }

  return (
    <ProfileContext.Provider value={{ current, profiles, open: show }}>
      {children}

      {open && (
        <Modal title={form ? (form.mode === "add" ? "New profile" : "Edit profile") : "Profiles"} onClose={() => !busy && !deleting && setOpen(false)}>
          {form ? (
            <form onSubmit={onSave} className="space-y-3">
              <label className="block">
                <span className="label">Name</span>
                <input
                  name="name"
                  required
                  maxLength={40}
                  autoFocus
                  defaultValue={form.mode === "edit" ? form.profile.name : ""}
                  placeholder="e.g. Ravi"
                  className="input mt-1"
                />
              </label>
              <label className="block">
                <span className="label">Bike</span>
                <input
                  name="bike"
                  required
                  maxLength={60}
                  defaultValue={form.mode === "edit" ? form.profile.bike : ""}
                  placeholder="e.g. Honda Activa 6G"
                  className="input mt-1"
                />
              </label>
              {form.mode === "add" && (
                <p className="text-xs text-zinc-500">Starts empty with its own refuels, reminders and odometer.</p>
              )}
              {error && <p className="text-sm text-red-400">{error}</p>}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button type="button" className="btn-ghost" onClick={() => setForm(null)} disabled={busy}>
                  Back
                </button>
                <button type="submit" className="btn-primary" disabled={busy}>
                  {busy ? "Saving…" : form.mode === "add" ? "Create & switch" : "Save"}
                </button>
              </div>
              {form.mode === "edit" && profiles.length > 1 && (
                <button
                  type="button"
                  onClick={() => setDeleting(form.profile)}
                  className="btn w-full text-red-400 hover:bg-red-500/10"
                >
                  <Trash2 className="h-4 w-4" /> Delete profile
                </button>
              )}
            </form>
          ) : (
            <>
              <ul className="space-y-2">
                {profiles.map((p) => {
                  const active = p.id === current.id;
                  return (
                    <li key={p.id} className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => switchTo(p)}
                        disabled={busy}
                        className={`flex min-w-0 flex-1 items-center gap-3 rounded-2xl border px-3 py-3 text-left transition ${
                          active ? "border-emerald-500/50 bg-emerald-500/10" : "border-zinc-800 hover:bg-zinc-800/50"
                        }`}
                      >
                        <Avatar profile={p} size="h-10 w-10 text-base" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-semibold">{p.name}</span>
                          <span className="block truncate text-xs text-zinc-400">{p.bike}</span>
                        </span>
                        {active && <Check className="h-5 w-5 text-emerald-400" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setError(null);
                          setForm({ mode: "edit", profile: p });
                        }}
                        className="rounded-xl p-3 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200"
                        aria-label={`Edit ${p.name}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    </li>
                  );
                })}
              </ul>
              {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setForm({ mode: "add" });
                }}
                className="btn mt-3 w-full border border-dashed border-zinc-700 text-zinc-300 hover:bg-zinc-800/50"
              >
                <Plus className="h-4 w-4" /> Add profile
              </button>
              <p className="mt-3 text-center text-[11px] text-zinc-500">
                Profiles aren&apos;t password-protected — anyone with the link can switch.
              </p>
            </>
          )}
        </Modal>
      )}

      {deleting && (
        <ConfirmDialog
          title={`Delete ${deleting.name}?`}
          confirmLabel="Delete profile"
          message={
            <>
              <p>
                This permanently deletes <span className="font-semibold text-zinc-100">{deleting.name}</span>&apos;s profile and{" "}
                <span className="font-semibold text-zinc-100">all of its refuels, services, reminders and odometer readings</span>.
              </p>
              <p className="mt-2 text-zinc-400">Export it to Excel first if you might need it. This can&apos;t be undone.</p>
            </>
          }
          busy={busy}
          error={error}
          onConfirm={() =>
            run(() => sendJson(`/api/profiles/${deleting.id}`, "DELETE"), () => {
              setDeleting(null);
              setForm(null);
            })
          }
          onCancel={() => setDeleting(null)}
        />
      )}
    </ProfileContext.Provider>
  );
}
