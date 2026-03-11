"use client";

import { useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { apiPost } from "@/lib/api";

function getErrorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  return "Something went wrong";
}

export default function NewCandidatePage() {
  const { user, isLoaded } = useUser();
  const userId = user?.id ?? "";
  const headers: Record<string, string> = userId ? { "X-User-Id": userId } : {};

  const params = useParams<{ id: string }>();
  const eventId = Number(params.id);
  const router = useRouter();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setPhoto(result);
      setPhotoPreview(result);
    };
    reader.readAsDataURL(file);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) { setError("Name is required."); return; }
    if (!isLoaded || !userId) { setError("Not signed in."); return; }

    setSubmitting(true);
    setError(null);
    try {
      await apiPost(
        `/events/${eventId}/candidates`,
        { name: trimmed, description: description.trim() || null, photo: photo ?? null },
        { headers }
      );
      router.push(`/events/${eventId}`);
    } catch (err) {
      setError(getErrorMessage(err));
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(1200px_600px_at_20%_10%,rgba(148,163,184,0.18),transparent),radial-gradient(900px_500px_at_80%_30%,rgba(59,130,246,0.10),transparent),linear-gradient(to_bottom,#0b1220,#070b13)] text-slate-100">
      <div className="mx-auto max-w-2xl px-6 py-10">
        <Link href={`/events/${eventId}`} className="text-sm text-slate-400 hover:text-white transition">
          ← Back to Event
        </Link>

        <div className="mt-8">
          <div className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">New Candidate</div>
          <h1 className="text-3xl font-extrabold tracking-tight">Add a Candidate</h1>
          <p className="mt-1 text-slate-400 text-sm">Fill in the details below to add a new candidate to this event.</p>
        </div>

        <form onSubmit={onSubmit} className="mt-8 space-y-6">
          {/* Photo upload */}
          <div className="flex flex-col items-center gap-4">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="group relative h-32 w-32 overflow-hidden rounded-3xl border-2 border-dashed border-white/20 bg-white/5 hover:border-indigo-500/50 hover:bg-indigo-500/5 transition"
            >
              {photoPreview ? (
                <img src={photoPreview} alt="Preview" className="h-full w-full object-cover" />
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-500 group-hover:text-indigo-400 transition">
                  <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z" />
                  </svg>
                  <span className="text-xs font-medium">Upload photo</span>
                </div>
              )}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
            {photoPreview && (
              <button
                type="button"
                onClick={() => { setPhoto(null); setPhotoPreview(null); }}
                className="text-xs text-slate-500 hover:text-rose-400 transition"
              >
                Remove photo
              </button>
            )}
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-1.5">
              Full Name <span className="text-rose-400">*</span>
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex Johnson"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-slate-100 placeholder:text-slate-500 outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-1.5">
              Bio / Notes <span className="text-slate-500 font-normal">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A brief description of the candidate…"
              rows={4}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-slate-100 placeholder:text-slate-500 outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition resize-none"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white hover:bg-indigo-500 disabled:opacity-50 transition"
            >
              {submitting ? "Adding…" : "Add Candidate"}
            </button>
            <Link
              href={`/events/${eventId}`}
              className="rounded-xl border border-white/10 px-6 py-3 text-sm font-semibold text-slate-400 hover:bg-white/5 transition text-center"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}
