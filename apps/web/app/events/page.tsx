"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { UserButton, useUser } from "@clerk/nextjs";
import { apiGet, apiPost } from "@/lib/api";

type EventRow = {
  id: number;
  name: string;
  description?: string | null;
  created_at: string;
};

function getErrorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  return "Something went wrong";
}

const EVENT_GRADIENTS = [
  "from-indigo-500/20 to-violet-500/10 border-indigo-500/20",
  "from-sky-500/20 to-blue-500/10 border-sky-500/20",
  "from-emerald-500/20 to-teal-500/10 border-emerald-500/20",
  "from-amber-500/20 to-orange-500/10 border-amber-500/20",
  "from-rose-500/20 to-pink-500/10 border-rose-500/20",
  "from-fuchsia-500/20 to-purple-500/10 border-fuchsia-500/20",
];

export default function EventsPage() {
  const { user, isLoaded } = useUser();
  const userId = user?.id ?? "";
  const headers: Record<string, string> = userId ? { "X-User-Id": userId } : {};

  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [eventName, setEventName] = useState("");
  const [eventDesc, setEventDesc] = useState("");
  const [creatingEvent, setCreatingEvent] = useState(false);

  async function loadEvents() {
    setError(null);
    setLoadingEvents(true);
    try {
      const data = await apiGet<EventRow[]>("/events", { headers });
      setEvents(data);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoadingEvents(false);
    }
  }

  async function createEvent() {
    setError(null);
    const name = eventName.trim();
    if (!name) { setError("Event name is required."); return; }

    setCreatingEvent(true);
    try {
      await apiPost<EventRow>("/events", { name, description: eventDesc.trim() || null }, { headers });
      setEventName("");
      setEventDesc("");
      setShowForm(false);
      await loadEvents();
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setCreatingEvent(false);
    }
  }

  useEffect(() => {
    if (!isLoaded || !userId) return;
    void loadEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, userId]);

  return (
    <main className="min-h-screen bg-[radial-gradient(1200px_600px_at_20%_10%,rgba(148,163,184,0.18),transparent),radial-gradient(900px_500px_at_80%_30%,rgba(59,130,246,0.10),transparent),linear-gradient(to_bottom,#0b1220,#070b13)] text-slate-100">
      <div className="mx-auto max-w-5xl px-6 py-10">

        {/* Nav */}
        <div className="flex items-center justify-between">
          <Link href="/" className="text-sm text-slate-400 hover:text-white transition">
            ← Home
          </Link>
          <UserButton afterSignOutUrl="/" />
        </div>

        {/* Header */}
        <div className="mt-10 flex items-end justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">Dashboard</div>
            <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              Your Events
            </h1>
            <p className="mt-1 text-slate-400 text-sm">Manage rush cycles, panels, or review sessions.</p>
          </div>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="shrink-0 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition"
          >
            {showForm ? "✕ Cancel" : "+ New Event"}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
            {error}
          </div>
        )}

        {/* Create form — slides in */}
        {showForm && (
          <div className="mt-6 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-6">
            <h2 className="text-lg font-bold mb-4">Create a new event</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-1.5">
                  Event name <span className="text-rose-400">*</span>
                </label>
                <input
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  placeholder="Spring Rush 2026"
                  onKeyDown={(e) => { if (e.key === "Enter") void createEvent(); }}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-1.5">
                  Description <span className="text-slate-500 font-normal">(optional)</span>
                </label>
                <textarea
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition resize-none"
                  value={eventDesc}
                  onChange={(e) => setEventDesc(e.target.value)}
                  placeholder="Invite-only rush cycle…"
                  rows={2}
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => void createEvent()}
                  disabled={creatingEvent || !userId}
                  className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 transition"
                >
                  {creatingEvent ? "Creating…" : "Create Event"}
                </button>
                <button
                  onClick={() => setShowForm(false)}
                  className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-slate-400 hover:bg-white/5 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Events grid */}
        <div className="mt-8">
          {loadingEvents && (
            <div className="text-sm text-slate-500 text-center py-10">Loading…</div>
          )}

          {!loadingEvents && events.length === 0 && (
            <div className="rounded-2xl border border-dashed border-white/10 py-20 text-center">
              <div className="text-4xl mb-3">📋</div>
              <div className="text-slate-400 font-medium">No events yet</div>
              <div className="text-slate-500 text-sm mt-1">Click "+ New Event" to get started.</div>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((e, i) => (
              <Link
                key={e.id}
                href={`/events/${e.id}`}
                className={`group relative block rounded-2xl border bg-gradient-to-br p-6 transition hover:scale-[1.02] hover:shadow-xl ${EVENT_GRADIENTS[i % EVENT_GRADIENTS.length]}`}
              >
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  {new Date(e.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                </div>
                <div className="text-xl font-bold text-white group-hover:text-white leading-tight">{e.name}</div>
                {e.description && (
                  <div className="mt-2 text-sm text-slate-400 line-clamp-2">{e.description}</div>
                )}
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs text-slate-500">Click to manage →</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
