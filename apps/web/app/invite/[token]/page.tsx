"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { apiGet, apiPost } from "@/lib/api";

type InviteInfo = {
  id: number;
  event_id: number;
  event_name: string;
  email: string;
  role: string;
  invited_by: string;
  accepted_at: string | null;
  created_at: string;
};

function getErrorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  return "Something went wrong";
}

const ROLE_LABEL: Record<string, string> = {
  organizer: "Organizer",
  editor: "Editor",
  voter: "Voter",
};

const ROLE_DESC: Record<string, string> = {
  editor: "Can add, edit, and delete candidates — everything except removing the event.",
  voter: "Can view candidates and submit votes.",
};

export default function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const { user, isLoaded } = useUser();
  const router = useRouter();

  const [invite, setInvite] = useState<InviteInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    apiGet<InviteInfo>(`/invites/${token}`)
      .then((data) => { setInvite(data); setLoading(false); })
      .catch((e) => { setError(getErrorMessage(e)); setLoading(false); });
  }, [token]);

  async function accept() {
    if (!user) return;
    setAccepting(true);
    setError(null);
    try {
      const headers = { "X-User-Id": user.id };
      await apiPost(`/invites/${token}/accept`, {}, { headers });
      setAccepted(true);
      setTimeout(() => router.push(`/events/${invite!.event_id}`), 1500);
    } catch (e) {
      setError(getErrorMessage(e));
      setAccepting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(1200px_600px_at_20%_10%,rgba(148,163,184,0.18),transparent),radial-gradient(900px_500px_at_80%_30%,rgba(59,130,246,0.10),transparent),linear-gradient(to_bottom,#0b1220,#070b13)] text-slate-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur">

          {loading && (
            <div className="text-center text-slate-400 py-8">Loading invite…</div>
          )}

          {!loading && error && !invite && (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">🔗</div>
              <div className="text-lg font-bold text-rose-400">Invite not found</div>
              <p className="mt-2 text-sm text-slate-400">This link may have expired or already been used.</p>
              <Link href="/" className="mt-6 inline-block text-sm text-slate-400 hover:text-white transition">← Home</Link>
            </div>
          )}

          {invite && (
            <>
              <div className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">You&apos;ve been invited</div>
              <h1 className="text-2xl font-extrabold tracking-tight">{invite.event_name}</h1>

              <div className="mt-4 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 px-4 py-3">
                <div className="text-sm text-slate-300">
                  You&apos;re invited as a{" "}
                  <span className="font-bold text-indigo-300">{ROLE_LABEL[invite.role] ?? invite.role}</span>
                </div>
                {ROLE_DESC[invite.role] && (
                  <div className="mt-1 text-xs text-slate-500">{ROLE_DESC[invite.role]}</div>
                )}
              </div>

              {invite.accepted_at && !accepted && (
                <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
                  This invite has already been accepted.
                </div>
              )}

              {error && (
                <div className="mt-4 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
                  {error}
                </div>
              )}

              {accepted && (
                <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                  ✓ Joined! Redirecting to the event…
                </div>
              )}

              {/* Actions */}
              {!invite.accepted_at && !accepted && (
                <div className="mt-6">
                  {!isLoaded ? (
                    <div className="text-sm text-slate-500 text-center">Loading…</div>
                  ) : user ? (
                    <button
                      onClick={accept}
                      disabled={accepting}
                      className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white hover:bg-indigo-500 disabled:opacity-50 transition"
                    >
                      {accepting ? "Joining…" : `Accept as ${user.firstName ?? user.emailAddresses[0]?.emailAddress}`}
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm text-slate-400 text-center mb-4">Sign in to accept this invite.</p>
                      <Link
                        href={`/login?redirect_url=/invite/${token}`}
                        className="block w-full rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white hover:bg-indigo-500 transition text-center"
                      >
                        Log In to Accept
                      </Link>
                      <Link
                        href={`/signup?redirect_url=/invite/${token}`}
                        className="block w-full rounded-xl border border-white/10 py-3 text-sm font-semibold text-slate-300 hover:bg-white/5 transition text-center"
                      >
                        Create Account &amp; Accept
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
