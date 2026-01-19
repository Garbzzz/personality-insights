import { apiGet } from "@/lib/api";
import SubmitForm from "./submit-form";

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

export default async function CandidatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const candidateId = Number(id);

  if (!Number.isFinite(candidateId)) {
    return (
      <main style={{ padding: 24 }}>
        <h1>Bad candidate id</h1>
        <p>id: {id}</p>
      </main>
    );
  }

  // Fetch submissions (this already exists)
  const submissions = await apiGet<Submission[]>(
    `/candidates/${candidateId}/submissions`
  );

  // Fetch profile (this will work after we add the backend endpoint)
  // For now, we wrap in try/catch so your page doesn't break.
  let profile: Profile | null = null;
  try {
    profile = await apiGet<Profile>(`/candidates/${candidateId}/profile`);
  } catch {
    profile = null;
  }

  return (
    <main style={{ padding: 24 }}>
      <h1>Candidate #{candidateId}</h1>

      <SubmitForm candidateId={candidateId} />

      <section style={{ marginTop: 20 }}>
        <h2>Profile</h2>

        {!profile ? (
          <p style={{ opacity: 0.8 }}>
            Profile endpoint not ready yet (once /profile is implemented, this will populate).
          </p>
        ) : (
          <>
            <p>
              Yes: {profile.vote_summary.yes} | Neutral:{" "}
              {profile.vote_summary.neutral} | No: {profile.vote_summary.no} | Score:{" "}
              {profile.vote_summary.score}
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 16,
                marginTop: 12,
              }}
            >
              <div>
                <h3>Top Positives</h3>
                <ul>
                  {profile.positives.map((t) => (
                    <li key={t.label}>
                      <b>{t.label}</b> ({t.count})
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3>Top Concerns</h3>
                <ul>
                  {profile.negatives.map((t) => (
                    <li key={t.label}>
                      <b>{t.label}</b> ({t.count})
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </>
        )}
      </section>

      <h2 style={{ marginTop: 24 }}>Submissions</h2>
      <ul>
        {submissions.map((s) => (
          <li key={s.id}>
            <b>{s.vote}</b> — {s.comment}
          </li>
        ))}
      </ul>
    </main>
  );
}
