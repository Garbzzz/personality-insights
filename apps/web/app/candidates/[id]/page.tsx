import { apiGet } from "@/lib/api";
import Link from "next/link";
import { Button, Card, CardBody, Pill } from "../../components/ui";

type Candidate = { id: number; name: string; created_at: string };

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

function VotePill({ v }: { v: number }) {
  const cls =
    v === 1
      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
      : v === 0
      ? "border-amber-500/20 bg-amber-500/10 text-amber-200"
      : "border-rose-500/20 bg-rose-500/10 text-rose-200";

  const label = v === 1 ? "+1" : v === 0 ? "0" : "-1";
  return (
    <span className={["inline-flex items-center rounded-full border px-2 py-0.5 text-xs", cls].join(" ")}>
      {label}
    </span>
  );
}

function TraitList({
  title,
  items,
}: {
  title: string;
  items: { label: string; count: number; examples: string[] }[];
}) {
  return (
    <Card>
      <CardBody>
        <h3 className="text-lg font-bold">{title}</h3>
        {items.length === 0 ? (
          <p className="mt-2 text-sm text-slate-300">No items yet.</p>
        ) : (
          <ul className="mt-4 grid gap-3">
            {items.map((t) => (
              <li key={t.label} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="font-semibold">{t.label}</div>
                  <Pill>{t.count}</Pill>
                </div>

                {t.examples?.length ? (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm text-slate-300 hover:text-slate-100">
                      evidence
                    </summary>
                    <ul className="mt-2 grid gap-2 pl-4 text-sm text-slate-200">
                      {t.examples.map((ex, i) => (
                        <li key={i} className="list-disc opacity-90">
                          {ex}
                        </li>
                      ))}
                    </ul>
                  </details>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}

export default async function CandidatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const candidateId = Number(id);

  if (!Number.isFinite(candidateId)) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 p-10">
        <h1 className="text-2xl font-bold">Bad candidate id</h1>
        <p className="text-slate-300">id: {id}</p>
      </main>
    );
  }

  // Fetch candidate name (using existing endpoint)
  const allCandidates = await apiGet<Candidate[]>("/candidates");
  const cand = allCandidates.find((c) => c.id === candidateId);
  const candidateName = cand?.name ?? `Candidate #${candidateId}`;

  const submissions = await apiGet<Submission[]>(
    `/candidates/${candidateId}/submissions`
  );

  let profile: Profile | null = null;
  try {
    profile = await apiGet<Profile>(`/candidates/${candidateId}/profile`);
  } catch {
    profile = null;
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(1200px_600px_at_20%_10%,rgba(148,163,184,0.18),transparent),radial-gradient(900px_500px_at_80%_30%,rgba(59,130,246,0.10),transparent),linear-gradient(to_bottom,#0b1220,#070b13)] text-slate-100">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="flex items-center justify-between">
          <Link href="/candidates" className="text-sm text-slate-300 hover:text-white">
            ← Back to Candidates
          </Link>

          <div className="flex items-center gap-2">
            <Pill>{candidateName}</Pill>
            <Button
              href={`/submit?candidateId=${candidateId}`}
              className="bg-slate-200 text-slate-900 hover:bg-white"
            >
              Submit Vote
            </Button>
          </div>
        </div>

        <div className="mt-8 grid gap-6">
          <Card>
            <CardBody>
              <h1 className="text-3xl font-extrabold tracking-tight">{candidateName}</h1>
              <p className="mt-1 text-slate-300">
                View aggregated personality insights and recent submissions.
              </p>
            </CardBody>
          </Card>

          <section>
            <h2 className="text-xl font-bold">Profile</h2>

            {!profile ? (
              <p className="mt-2 text-slate-300">Profile not available yet.</p>
            ) : (
              <>
                <Card className="mt-4">
                  <CardBody className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="font-semibold">Votes:</span>
                    <Pill>Yes {profile.vote_summary.yes}</Pill>
                    <Pill>Neutral {profile.vote_summary.neutral}</Pill>
                    <Pill>No {profile.vote_summary.no}</Pill>
                    <span className="ml-2 font-semibold">Score:</span>
                    <Pill>{profile.vote_summary.score}</Pill>
                  </CardBody>
                </Card>

                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <TraitList title="Top Positives" items={profile.positives} />
                  <TraitList title="Top Concerns" items={profile.negatives} />
                </div>
              </>
            )}
          </section>

          <section>
            <h2 className="text-xl font-bold">Submissions</h2>

            <div className="mt-4 grid gap-3">
              {submissions.length === 0 ? (
                <p className="text-slate-300">No submissions yet.</p>
              ) : (
                submissions.map((s) => (
                  <Card key={s.id}>
                    <CardBody className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="text-sm text-slate-300">
                          {new Date(s.created_at).toLocaleString()}
                        </div>
                        <div className="mt-1 text-slate-100">
                          {s.comment ? s.comment : <span className="text-slate-400">(no comment)</span>}
                        </div>
                      </div>
                      <VotePill v={s.vote} />
                    </CardBody>
                  </Card>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
