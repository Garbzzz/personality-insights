"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { UserButton, useUser } from "@clerk/nextjs";
import { Badge, Card, CardBody, Pill } from "@/app/components/ui";
import { apiDelete, apiGet, apiPost } from "@/lib/api";

type EventRow = { id: number; name: string; description?: string | null; created_at: string };
type Candidate = { id: number; name: string; description?: string | null; photo?: string | null; created_at: string };
type Submission = { id: number; candidate_id: number; user_id: string; vote: number; comment: string; created_at: string };
type Member = { id: number; user_id: string; role: string; created_at: string };
type Invite = { id: number; event_id: number; email: string; role: string; token: string; invited_by: string; accepted_at: string | null; created_at: string };

function approval(yes: number, no: number) {
  const d = yes + no; return d === 0 ? 0 : Math.round((yes / d) * 100);
}
function getErrorMessage(e: unknown): string {
  return e instanceof Error ? e.message : "Something went wrong";
}
function initials(name: string) {
  return name.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
}
const AVATAR_COLORS = [
  "from-violet-500 to-indigo-600", "from-sky-500 to-blue-600",
  "from-emerald-500 to-teal-600", "from-amber-500 to-orange-600",
  "from-rose-500 to-pink-600", "from-fuchsia-500 to-purple-600",
];
function avatarColor(id: number) { return AVATAR_COLORS[id % AVATAR_COLORS.length]; }

const ROLE_BADGE: Record<string, string> = {
  organizer: "bg-violet-500/20 text-violet-300 border-violet-500/30",
  editor:    "bg-sky-500/20 text-sky-300 border-sky-500/30",
  voter:     "bg-slate-500/20 text-slate-300 border-slate-500/30",
};

export default function EventDetailPage() {
  const { user, isLoaded } = useUser();
  const userId = user?.id ?? "";
  const headers: Record<string, string> = userId ? { "X-User-Id": userId } : {};

  const params = useParams<{ id: string }>();
  const eventId = Number(params.id);

  const [msg, setMsg]                   = useState<string | null>(null);
  const [event, setEvent]               = useState<EventRow | null>(null);
  const [userRole, setUserRole]         = useState<string | null>(null);
  const [candidates, setCandidates]     = useState<Candidate[]>([]);
  const [subsById, setSubsById]         = useState<Record<number, Submission[]>>({});
  const [search, setSearch]             = useState("");
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; name: string } | null>(null);
  const [votingId, setVotingId]         = useState<number | null>(null);
  const [voteValue, setVoteValue]       = useState<number>(1);
  const [voteComment, setVoteComment]   = useState("");

  // Members modal state
  const [showMembers, setShowMembers]   = useState(false);
  const [members, setMembers]           = useState<Member[]>([]);
  const [invites, setInvites]           = useState<Invite[]>([]);
  const [inviteEmail, setInviteEmail]   = useState("");
  const [inviteRole, setInviteRole]     = useState<"editor" | "voter">("voter");
  const [inviteMsg, setInviteMsg]       = useState<string | null>(null);
  const [newInviteLink, setNewInviteLink] = useState<string | null>(null);
  const [copiedToken, setCopiedToken]   = useState<string | null>(null);

  const canEdit   = userRole === "organizer" || userRole === "editor";
  const isOrganizer = userRole === "organizer";

  async function loadEventMeta() {
    const [found, me] = await Promise.all([
      apiGet<EventRow>(`/events/${eventId}`, { headers }),
      apiGet<{ event_id: number; role: string }>(`/events/${eventId}/me`, { headers }),
    ]);
    setEvent(found);
    setUserRole(me.role);
  }

  async function loadCandidates() {
    setMsg(null);
    const list = await apiGet<Candidate[]>(`/events/${encodeURIComponent(String(eventId))}/candidates`, { headers });
    setCandidates(list);
    const entries = await Promise.all(
      list.map(async (c) => [c.id, await apiGet<Submission[]>(`/candidates/${c.id}/submissions`, { headers })] as const)
    );
    const map: Record<number, Submission[]> = {};
    for (const [id, subs] of entries) map[id] = subs;
    setSubsById(map);
  }

  async function loadMembers() {
    const [m, inv] = await Promise.all([
      apiGet<Member[]>(`/events/${eventId}/members`, { headers }),
      apiGet<Invite[]>(`/events/${eventId}/invites`, { headers }),
    ]);
    setMembers(m);
    setInvites(inv);
  }

  useEffect(() => {
    if (!isLoaded || !userId) return;
    let alive = true;
    (async () => {
      try {
        await loadEventMeta();
        await loadCandidates();
      } catch (err: unknown) {
        if (!alive) return;
        setMsg(getErrorMessage(err));
      }
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId, isLoaded, userId]);

  async function confirmDeleteNow() {
    if (!confirmDelete) return;
    await apiDelete(`/candidates/${confirmDelete.id}`, { headers });
    setConfirmDelete(null);
    await loadCandidates();
  }

  function openVote(c: Candidate) {
    const existing = (subsById[c.id] ?? []).find((s) => s.user_id === userId);
    setVoteValue(existing?.vote ?? 1);
    setVoteComment(existing?.comment ?? "");
    setVotingId(c.id);
  }

  async function submitVote(candidateId: number) {
    await apiPost(`/candidates/${candidateId}/submissions`, { vote: voteValue, comment: voteComment }, { headers });
    setVotingId(null);
    await loadCandidates();
  }

  async function sendInvite() {
    setInviteMsg(null);
    setNewInviteLink(null);
    const email = inviteEmail.trim().toLowerCase();
    if (!email) { setInviteMsg("Enter an email address."); return; }
    try {
      const inv = await apiPost<Invite>(`/events/${eventId}/invites`, { email, role: inviteRole }, { headers });
      const link = `${window.location.origin}/invite/${inv.token}`;
      setNewInviteLink(link);
      setInviteEmail("");
      await loadMembers();
    } catch (e) { setInviteMsg(getErrorMessage(e)); }
  }

  async function revokeInvite(inviteId: number) {
    await apiDelete(`/events/${eventId}/invites/${inviteId}`, { headers });
    await loadMembers();
  }

  async function removeMember(membUserId: string) {
    await apiDelete(`/events/${eventId}/members/${membUserId}`, { headers });
    await loadMembers();
  }

  function copyLink(link: string, token: string) {
    navigator.clipboard.writeText(link).then(() => {
      setCopiedToken(token);
      setTimeout(() => setCopiedToken(null), 2000);
    });
  }

  function openMembersModal() {
    setShowMembers(true);
    setInviteMsg(null);
    setNewInviteLink(null);
    loadMembers().catch(() => {});
  }

  const title = useMemo(() => event?.name ?? `Event #${eventId}`, [event, eventId]);

  const filteredCandidates = useMemo(() => {
    if (!search.trim()) return candidates;
    const q = search.trim().toLowerCase();
    return candidates.filter((c) => c.name.toLowerCase().includes(q));
  }, [candidates, search]);

  return (
    <main className="min-h-screen bg-[radial-gradient(1200px_600px_at_20%_10%,rgba(148,163,184,0.18),transparent),radial-gradient(900px_500px_at_80%_30%,rgba(59,130,246,0.10),transparent),linear-gradient(to_bottom,#0b1220,#070b13)] text-slate-100">
      <div className="mx-auto max-w-5xl px-6 py-10">

        {/* Top nav */}
        <div className="flex items-center justify-between">
          <Link href="/events" className="text-sm text-slate-400 hover:text-white transition">← Events</Link>
          <div className="flex items-center gap-3">
            {isOrganizer && (
              <button
                onClick={openMembersModal}
                className="rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-white/5 transition flex items-center gap-2"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
                </svg>
                Members
              </button>
            )}
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>

        {/* Hero */}
        <div className="mt-10 flex items-end justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="text-xs font-semibold uppercase tracking-widest text-slate-500">Event</div>
              {userRole && (
                <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${ROLE_BADGE[userRole] ?? ROLE_BADGE.voter}`}>
                  {userRole}
                </span>
              )}
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">{title}</h1>
            {event?.description && <p className="mt-2 text-slate-400 max-w-xl">{event.description}</p>}
          </div>
          <Pill>{candidates.length} candidates</Pill>
        </div>

        {/* Search + Add */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0Z" />
            </svg>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search candidates…"
              className="w-full rounded-xl border border-white/10 bg-white/5 pl-9 pr-4 py-2.5 text-slate-100 placeholder:text-slate-500 outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition" />
          </div>
          {canEdit && (
            <Link href={`/events/${eventId}/candidates/new`}
              className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition">
              + Add Candidate
            </Link>
          )}
          <button type="button" onClick={() => loadCandidates().catch(() => {})}
            className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-slate-300 hover:bg-white/5 transition">
            Refresh
          </button>
          {msg && <span className="w-full text-sm text-rose-400">{msg}</span>}
        </div>

        {/* Candidate list */}
        <div className="mt-6 grid gap-4">
          {candidates.length === 0 && isLoaded && (
            <div className="rounded-2xl border border-dashed border-white/10 py-16 text-center text-slate-500">
              {canEdit ? 'No candidates yet — click "+ Add Candidate" to get started.' : "No candidates yet."}
            </div>
          )}
          {candidates.length > 0 && filteredCandidates.length === 0 && (
            <div className="rounded-2xl border border-dashed border-white/10 py-10 text-center text-slate-500">
              No candidates match &ldquo;{search}&rdquo;
            </div>
          )}

          {filteredCandidates.map((c) => {
            const subs   = subsById[c.id] ?? [];
            const yes    = subs.filter((s) => s.vote === 1).length;
            const neu    = subs.filter((s) => s.vote === 0).length;
            const no     = subs.filter((s) => s.vote === -1).length;
            const pct    = approval(yes, no);
            const myVote = subs.find((s) => s.user_id === userId);
            const isVoting = votingId === c.id;

            return (
              <Card key={c.id} className="transition hover:border-white/20">
                <CardBody>
                  <div className="flex items-center gap-4">
                    <div className={`h-11 w-11 shrink-0 rounded-2xl overflow-hidden shadow-lg ${c.photo ? "" : `bg-gradient-to-br ${avatarColor(c.id)}`} flex items-center justify-center text-sm font-bold text-white`}>
                      {c.photo ? <img src={c.photo} alt={c.name} className="h-full w-full object-cover" /> : (initials(c.name) || "?")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-lg font-bold truncate">{c.name}</div>
                      <div className="text-xs text-slate-500">{subs.length} vote{subs.length !== 1 ? "s" : ""}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {/* Vote */}
                      {myVote != null ? (
                        <button onClick={() => isVoting ? setVotingId(null) : openVote(c)}
                          className={`rounded-xl px-3 py-1.5 text-sm font-semibold transition flex items-center gap-1.5 ${isVoting ? "bg-white/10 text-slate-300" : myVote.vote === 1 ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30" : myVote.vote === -1 ? "bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30" : "bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30"}`}>
                          {myVote.vote === 1 ? "👍" : myVote.vote === -1 ? "👎" : "😐"}<span>{isVoting ? "Cancel" : "Voted"}</span>
                        </button>
                      ) : (
                        <button onClick={() => openVote(c)} className="rounded-xl bg-indigo-600/80 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-500 transition">Vote</button>
                      )}
                      {/* Profile */}
                      <Link href={`/candidates/${c.id}?from=/events/${eventId}`}
                        className="rounded-xl border border-white/10 px-3 py-1.5 text-sm font-semibold text-slate-300 hover:border-white/25 hover:bg-white/5 transition">
                        Profile
                      </Link>
                      {/* Edit — organizer/editor only */}
                      {canEdit && (
                        <Link href={`/candidates/${c.id}?from=/events/${eventId}&edit=true`}
                          className="rounded-xl border border-white/10 px-3 py-1.5 text-sm font-semibold text-slate-400 hover:text-slate-200 hover:border-white/20 hover:bg-white/5 transition">
                          Edit
                        </Link>
                      )}
                      {/* Delete — organizer/editor only */}
                      {canEdit && (
                        <button onClick={() => setConfirmDelete({ id: c.id, name: c.name })}
                          className="rounded-xl border border-rose-500/20 px-3 py-1.5 text-sm font-semibold text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/40 transition">
                          Delete
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Vote panel */}
                  {isVoting && (
                    <div className="mt-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4 space-y-3">
                      <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Cast your vote</div>
                      <div className="flex gap-2">
                        {([1, 0, -1] as const).map((v) => (
                          <button key={v} type="button" onClick={() => setVoteValue(v)}
                            className={`flex-1 rounded-xl py-3 text-sm font-bold transition ${voteValue === v ? v === 1 ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : v === 0 ? "bg-amber-500 text-white shadow-lg shadow-amber-500/20" : "bg-rose-500 text-white shadow-lg shadow-rose-500/20" : "bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10 hover:text-slate-200"}`}>
                            {v === 1 ? "👍 Yes" : v === 0 ? "😐 Neutral" : "👎 No"}
                          </button>
                        ))}
                      </div>
                      <textarea value={voteComment} onChange={(e) => setVoteComment(e.target.value)}
                        placeholder="Add a comment… (optional)" rows={2}
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-indigo-500/30 resize-none" />
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => setVotingId(null)} className="rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-slate-400 hover:bg-white/5 transition">Cancel</button>
                        <button onClick={() => submitVote(c.id).catch((err: unknown) => setMsg(getErrorMessage(err)))}
                          className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition">
                          Submit Vote
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="mt-4 grid grid-cols-3 gap-3">
                    <Badge label="Positive" value={yes} tone="pos" />
                    <Badge label="Neutral" value={neu} tone="neu" />
                    <Badge label="Negative" value={no} tone="neg" />
                  </div>
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                      <span>Approval</span>
                      <span className={`font-bold text-sm ${pct >= 60 ? "text-emerald-400" : pct >= 40 ? "text-amber-400" : "text-rose-400"}`}>{pct}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-white/10">
                      <div className={`h-1.5 rounded-full transition-all ${pct >= 60 ? "bg-emerald-400" : pct >= 40 ? "bg-amber-400" : "bg-rose-400"}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>

        {/* Delete modal */}
        {confirmDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-6">
            <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
              <div className="text-lg font-bold">Delete candidate?</div>
              <p className="mt-2 text-sm text-slate-400">Permanently delete <span className="font-semibold text-slate-200">{confirmDelete.name}</span> and all their submissions.</p>
              <div className="mt-6 flex justify-end gap-2">
                <button onClick={() => setConfirmDelete(null)} className="rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-white/5 transition">Cancel</button>
                <button onClick={() => confirmDeleteNow().catch((e: unknown) => setMsg(getErrorMessage(e)))} className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-500 transition">Delete</button>
              </div>
            </div>
          </div>
        )}

        {/* Members modal — organizer only */}
        {showMembers && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 bg-slate-900 shadow-2xl">
              <div className="sticky top-0 flex items-center justify-between border-b border-white/10 bg-slate-900 px-6 py-4">
                <div className="text-lg font-bold">Members &amp; Invites</div>
                <button onClick={() => setShowMembers(false)} className="text-slate-400 hover:text-white transition text-xl leading-none">×</button>
              </div>

              <div className="p-6 space-y-8">
                {/* Current members */}
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Current Members</div>
                  <div className="space-y-2">
                    {members.map((m) => (
                      <div key={m.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-slate-200 truncate">
                            {m.user_id === userId ? "You" : m.user_id.slice(0, 16) + "…"}
                          </div>
                          <div className="text-xs text-slate-500">{new Date(m.created_at).toLocaleDateString()}</div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${ROLE_BADGE[m.role] ?? ROLE_BADGE.voter}`}>
                            {m.role}
                          </span>
                          {m.user_id !== userId && (
                            <button onClick={() => removeMember(m.user_id).catch(() => {})}
                              className="rounded-lg border border-rose-500/20 px-2 py-1 text-xs text-rose-400 hover:bg-rose-500/10 transition">
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Invite form */}
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Invite Someone</div>
                  <div className="space-y-3">
                    <input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="email@example.com"
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition" />
                    <div className="flex gap-2">
                      <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value as "editor" | "voter")}
                        className="rounded-xl border border-white/10 bg-slate-800 px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-indigo-500/50 transition">
                        <option value="voter">Voter — view &amp; vote only</option>
                        <option value="editor">Editor — full edit access</option>
                      </select>
                      <button onClick={sendInvite}
                        className="flex-1 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition">
                        Generate Link
                      </button>
                    </div>
                    {inviteMsg && <div className="text-sm text-rose-400">{inviteMsg}</div>}
                    {newInviteLink && (
                      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 space-y-2">
                        <div className="text-xs text-emerald-400 font-semibold">Invite link created — share it:</div>
                        <div className="flex items-center gap-2">
                          <input readOnly value={newInviteLink} className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300 outline-none" />
                          <button onClick={() => copyLink(newInviteLink, newInviteLink)}
                            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 transition">
                            {copiedToken === newInviteLink ? "Copied!" : "Copy"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Pending invites */}
                {invites.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Pending Invites</div>
                    <div className="space-y-2">
                      {invites.map((inv) => {
                        const link = `${window.location.origin}/invite/${inv.token}`;
                        return (
                          <div key={inv.id} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <div>
                                <div className="text-sm font-semibold text-slate-200">{inv.email}</div>
                                <div className="text-xs text-slate-500">{inv.accepted_at ? "✓ Accepted" : "Pending"}</div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${ROLE_BADGE[inv.role] ?? ROLE_BADGE.voter}`}>
                                  {inv.role}
                                </span>
                                {!inv.accepted_at && (
                                  <button onClick={() => revokeInvite(inv.id).catch(() => {})}
                                    className="rounded-lg border border-rose-500/20 px-2 py-1 text-xs text-rose-400 hover:bg-rose-500/10 transition">
                                    Revoke
                                  </button>
                                )}
                              </div>
                            </div>
                            {!inv.accepted_at && (
                              <div className="flex items-center gap-2">
                                <input readOnly value={link} className="flex-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-slate-400 outline-none" />
                                <button onClick={() => copyLink(link, inv.token)}
                                  className="rounded-lg bg-slate-700 px-2 py-1 text-xs font-semibold text-slate-200 hover:bg-slate-600 transition">
                                  {copiedToken === inv.token ? "✓" : "Copy"}
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
