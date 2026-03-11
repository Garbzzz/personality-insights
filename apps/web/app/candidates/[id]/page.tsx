import { apiGet } from "@/lib/api";
import Link from "next/link";
import { Card, CardBody } from "../../components/ui";
import EditCandidateForm from "./edit-form";

type Candidate = { id: number; name: string; description?: string | null; photo?: string | null; created_at: string };

type Submission = {
  id: number;
  candidate_id: number;
  vote: number;
  comment: string;
  created_at: string;
};

type Profile = {
  candidate_id: number;
  vote_summary: { yes: number; neutral: number; no: number; score: number };
  positives: { label: string; count: number; examples: string[] }[];
  negatives: { label: string; count: number; examples: string[] }[];
};

function VoteBadge({ v }: { v: number }) {
  if (v === 1)
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-300">
        👍 Yes
      </span>
    );
  if (v === -1)
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/30 bg-rose-500/15 px-3 py-1 text-xs font-bold text-rose-300">
        👎 No
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/15 px-3 py-1 text-xs font-bold text-amber-300">
      😐 Neutral
    </span>
  );
}

function TraitCard({
  item,
  tone,
}: {
  item: { label: string; count: number; examples: string[] };
  tone: "pos" | "neg";
}) {
  const colors =
    tone === "pos"
      ? {
          border: "border-emerald-500/20",
          bg: "bg-emerald-500/5",
          pill: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
          dot: "bg-emerald-400",
          text: "text-emerald-100",
        }
      : {
          border: "border-rose-500/20",
          bg: "bg-rose-500/5",
          pill: "bg-rose-500/20 text-rose-300 border-rose-500/30",
          dot: "bg-rose-400",
          text: "text-rose-100",
        };

  return (
    <div className={`rounded-2xl border ${colors.border} ${colors.bg} px-4 py-3`}>
      <div className="flex items-center justify-between gap-2">
        <div className={`font-semibold capitalize ${colors.text}`}>{item.label}</div>
        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold ${colors.pill}`}>
          ×{item.count}
        </span>
      </div>
      {item.examples?.length ? (
        <details className="mt-2">
          <summary className="cursor-pointer text-xs text-slate-400 hover:text-slate-200 transition">
            {item.examples.length} example{item.examples.length !== 1 ? "s" : ""}
          </summary>
          <ul className="mt-2 space-y-1 pl-2">
            {item.examples.map((ex, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${colors.dot}`} />
                {ex}
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}

export default async function CandidatePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ from?: string; edit?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const from = sp?.from ?? null;
  const isEditing = sp?.edit === "true";
  const candidateId = Number(id);

  if (!Number.isFinite(candidateId)) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 p-10">
        <h1 className="text-2xl font-bold">Bad candidate id</h1>
      </main>
    );
  }

  const allCandidates = await apiGet<Candidate[]>("/candidates");
  const cand = allCandidates.find((c) => c.id === candidateId);
  const candidateName = cand?.name ?? `Candidate #${candidateId}`;

  const submissions = await apiGet<Submission[]>(`/candidates/${candidateId}/submissions`);

  let profile: Profile | null = null;
  try {
    profile = await apiGet<Profile>(`/candidates/${candidateId}/profile`);
  } catch {
    profile = null;
  }

  const totalVotes = submissions.length;
  const pct =
    profile
      ? (() => {
          const d = profile.vote_summary.yes + profile.vote_summary.no;
          return d === 0 ? 0 : Math.round((profile.vote_summary.yes / d) * 100);
        })()
      : 0;

  return (
    <main className="min-h-screen bg-[radial-gradient(1200px_600px_at_20%_10%,rgba(148,163,184,0.18),transparent),radial-gradient(900px_500px_at_80%_30%,rgba(59,130,246,0.10),transparent),linear-gradient(to_bottom,#0b1220,#070b13)] text-slate-100">
      <div className="mx-auto max-w-5xl px-6 py-10">

        {/* Back */}
        <div className="flex items-center justify-between">
          <Link href={from ?? "/candidates"} className="text-sm text-slate-400 hover:text-white transition">
            ← Back
          </Link>
          {!isEditing && (
            <Link
              href={`/candidates/${candidateId}?${from ? `from=${encodeURIComponent(from)}&` : ""}edit=true`}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition"
            >
              Edit Profile
            </Link>
          )}
        </div>

        {/* Hero */}
        <div className="mt-8 rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] p-8 shadow-2xl">
          <div className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1">
            {isEditing ? "Editing Profile" : "Candidate Profile"}
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent mb-6">
            {candidateName}
          </h1>

          {/* Edit form */}
          {isEditing ? (
            <EditCandidateForm
              candidateId={candidateId}
              initialName={cand?.name ?? candidateName}
              initialDescription={cand?.description ?? null}
              initialPhoto={cand?.photo ?? null}
              from={from}
            />
          ) : (
            <>
              {/* Description */}
              {cand?.description && (
                <p className="mb-6 text-sm text-slate-400 max-w-xl">{cand.description}</p>
              )}

              {/* Photo */}
              {cand?.photo ? (
                <img
                  src={cand.photo}
                  alt={candidateName}
                  className="w-full max-w-sm rounded-2xl object-cover ring-1 ring-white/10 shadow-xl mb-6"
                />
              ) : (
                <div className="flex w-full max-w-sm items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/[0.03] py-14 mb-6">
                  <span className="text-sm text-slate-500">No photo</span>
                </div>
              )}

          {profile && (
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-4 text-center">
                <div className="text-3xl font-extrabold text-emerald-300">{profile.vote_summary.yes}</div>
                <div className="mt-1 text-xs font-semibold uppercase tracking-wider text-emerald-400/70">Yes</div>
              </div>
              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-4 text-center">
                <div className="text-3xl font-extrabold text-amber-300">{profile.vote_summary.neutral}</div>
                <div className="mt-1 text-xs font-semibold uppercase tracking-wider text-amber-400/70">Neutral</div>
              </div>
              <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-4 text-center">
                <div className="text-3xl font-extrabold text-rose-300">{profile.vote_summary.no}</div>
                <div className="mt-1 text-xs font-semibold uppercase tracking-wider text-rose-400/70">No</div>
              </div>
              <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/10 px-4 py-4 text-center">
                <div className={`text-3xl font-extrabold ${profile.vote_summary.score > 0 ? "text-indigo-300" : profile.vote_summary.score < 0 ? "text-rose-300" : "text-slate-300"}`}>
                  {profile.vote_summary.score > 0 ? "+" : ""}{profile.vote_summary.score}
                </div>
                <div className="mt-1 text-xs font-semibold uppercase tracking-wider text-indigo-400/70">Score</div>
              </div>
            </div>
          )}

          {profile && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                <span>Approval rating</span>
                <span className={`font-bold text-sm ${pct >= 60 ? "text-emerald-400" : pct >= 40 ? "text-amber-400" : "text-rose-400"}`}>
                  {pct}%
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-white/10">
                <div
                  className={`h-2 rounded-full transition-all ${pct >= 60 ? "bg-emerald-400" : pct >= 40 ? "bg-amber-400" : "bg-rose-400"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )}
            </>
          )}
        </div>

        {/* Traits */}
        {!isEditing && profile && (profile.positives.length > 0 || profile.negatives.length > 0) && (
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Positives */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="h-2 w-2 rounded-full bg-emerald-400" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-emerald-400">Strengths</h2>
              </div>
              <div className="space-y-2">
                {profile.positives.length === 0 ? (
                  <p className="text-sm text-slate-500">None identified yet.</p>
                ) : (
                  profile.positives.map((t) => <TraitCard key={t.label} item={t} tone="pos" />)
                )}
              </div>
            </div>

            {/* Negatives */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="h-2 w-2 rounded-full bg-rose-400" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-rose-400">Concerns</h2>
              </div>
              <div className="space-y-2">
                {profile.negatives.length === 0 ? (
                  <p className="text-sm text-slate-500">None identified yet.</p>
                ) : (
                  profile.negatives.map((t) => <TraitCard key={t.label} item={t} tone="neg" />)
                )}
              </div>
            </div>
          </div>
        )}

        {!isEditing && !profile && (
          <div className="mt-8 rounded-2xl border border-dashed border-white/10 py-12 text-center text-slate-500">
            No profile data yet — submit a vote with a comment to generate insights.
          </div>
        )}

        {/* Submissions */}
        {!isEditing && <div className="mt-10">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-lg font-bold">Submissions</h2>
            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs text-slate-400">{totalVotes}</span>
          </div>

          {submissions.length === 0 ? (
            <p className="text-sm text-slate-500">No submissions yet.</p>
          ) : (
            <div className="grid gap-3">
              {submissions.map((s) => (
                <Card key={s.id}>
                  <CardBody className="flex items-start justify-between gap-4 py-4">
                    <div className="min-w-0 flex-1">
                      <div className="text-xs text-slate-500 mb-1">
                        {new Date(s.created_at).toLocaleString()}
                      </div>
                      <div className="text-sm text-slate-200">
                        {s.comment || <span className="italic text-slate-500">No comment</span>}
                      </div>
                    </div>
                    <VoteBadge v={s.vote} />
                  </CardBody>
                </Card>
              ))}
            </div>
          )}
        </div>}
      </div>
    </main>
  );
}
